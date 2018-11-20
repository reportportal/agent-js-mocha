'use strict';

var client = require('sync-rest-client');

class ReportPortalClient {

    constructor(config) {
        this.config = config;
        this.token = "?access_token=" + config.password;
        this.RP_STATUS = {
            PASSED: 'passed',
            FAILED: 'failed',
            SKIPPED: 'skipped'
        };

        this.RP_LEVEL = {
            PASSED: 'INFO',
            FAILED: 'ERROR',
            SKIPPED: 'WARN',
            PENDING: 'ERROR',
            UNDEFINED: 'ERROR',
            PASSED_HOOK: 'DEBUG'
        };

        this.RP_ITEM_TYPE = {
            SUITE : 'SUITE',
            TEST: 'TEST',
            STEP: 'STEP'
        };
    }

    _clientOptions() {
        return {
            rejectUnauthorized: false,
            username: this.config.username,
            password: this.config.password,
            headers: {
                'User-Agent': 'Node.js',
                'Content-Type': 'application/json'
            }
        };
    }

    errorHandler(error) {
        console.error("Failed communication with report portal", error);
    }


    _formatName(name) {
        var MIN = 3;
        var MAX = 256;
        var len = name.length;
        return ((len < MIN) ? (name + new Array(MIN - len + 1).join('.')) : name).slice(-MAX);
    }

    _now() {
        return new Date().valueOf();
    }

    startLaunch(description) {
        var _self = this;

        var request = Object.assign(_self._clientOptions(), {
            payload: {
                name: _self._formatName(this.config.launch),
                start_time: _self._now(),
                description: description === undefined ? "" : description,
                tags: this.config.tags
            }
        })

        try {
            return client.post([_self.config.endpoint, _self.config.project, 'launch'].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }
    }

    finishLaunch(launch) {
        var _self = this;
        var request = Object.assign(_self._clientOptions(), {
            payload: {
                end_time: _self._now()
            }
        });

        try {
            return client.put([_self.config.endpoint, _self.config.project, 'launch', launch, "finish"].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }
    }

    startRootItem(item) {
        var _self = this;

        var request = Object.assign(_self._clientOptions(), {
            payload: {
                name: _self._formatName(item.name),
                launch_id: item.launch,
                start_time: _self._now(),
                type: item.type,
                description: item.description,
                tags: _self.config.tags
            }
        });

        try {
            return client.post([_self.config.endpoint, _self.config.project, 'item'].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }

    }

    startChildItem(item, parentId) {
        var _self = this;

        var request = Object.assign(_self._clientOptions(), {
            payload: {
                name: _self._formatName(item.name),
                launch_id: item.launch,
                start_time: _self._now(),
                type: item.type,
                description: item.description,
                tags: _self.config.tags
            }
        })

        try {
            return client.post([_self.config.endpoint, _self.config.project, 'item', parentId].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }

    }

    finishItem(item) {
        var _self = this;

        var request = Object.assign(_self._clientOptions(), {
            payload: {
                status: item.status,
                end_time: _self._now()
            }
        });

        if (item.reason !== undefined) {
            request.issue = {
                issue_type: item.reason
            }
        }

        try {
            return client.put([_self.config.endpoint, _self.config.project, 'item', item.id].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }

    }

    updateItem(item) {
        var _self = this;

        var request = Object.assign(_self._clientOptions(), {
            payload: {
                description: item.description
            }
        });

        try {
            return client.put([_self.config.endpoint, _self.config.project, 'item', item.id, "update"].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }

    }

    sendLog(id, item) {
        var _self = this;
        var request =Object.assign(_self._clientOptions(), {
            payload: {
                item_id: id,
                time: _self._now(),
                level: item.level,
                message: item.message
            }
        });

        try {
            client.post([_self.config.endpoint, _self.config.project, 'log'].join('/') + _self.token, request);
        } catch (err) {
            _self.errorHandler(err);
        }


    }

    buildMultiPartStream(jsonPart, filePart, boundary) {
        var eol = "\r\n";
        var bx = "--" + boundary;
        var buffers = [
            new Buffer(
                bx + eol + "Content-Disposition: form-data; name=\"json_request_part\"" +
                eol + "Content-Type: application/json" + eol +
                eol + eol + JSON.stringify(jsonPart) + eol
            ),
            new Buffer(
                bx + eol + "Content-Disposition: form-data; name=\"file\"; filename=\"" + filePart.name + "\"" + eol +
                "Content-Type: " + filePart.type + eol + eol
            ),
            new Buffer(filePart.content, 'base64'),
            new Buffer(eol + bx + '--' + eol)
        ];
        return Buffer.concat(buffers);
    }

    // TODO implement sendFile function
    // sendFile(itemId, attachmentName, level, mimeType, fileData) {
    //
    //     var _self = this;
    //
    //     var options = {
    //         user: this.config.username, password: this.config.password,
    //         connection: {
    //             headers: {'User-Agent': "Node.js", "Content-Type": "application/json"},
    //             rejectUnauthorized: false
    //         }
    //     };
    //     var client = new Client(options);
    //     var filename = attachmentName;
    //     var boundary = Math.floor(Math.random() * 10000000000).toString();
    //     var json = [{
    //         item_id: itemId,
    //         time: _self._now(),
    //         level: level,
    //         message: filename,
    //         file: {name: filename}
    //     }];
    //     var file = {
    //         name: filename,
    //         type: mimeType,
    //         content: fileData
    //     };
    //
    //     var args = {
    //         data: _self.buildMultiPartStream(json, file, boundary),
    //         headers: {'User-Agent': "Node.js", "Content-Type": "multipart/form-data; boundary=" + boundary}
    //     };
    //     client.registerMethod('createLog', [_self.config.endpoint, _self.config.project, 'log'].join('/'), 'POST');
    //
    //     function postFile(resolve, reject){
    //         client.methods.createLog(args, function(data, response){
    //             resolve(data);
    //         }).on('error', function(err){
    //             _self.errorHandler(err);
    //         });
    //     };
    //
    //     return new Promise(postFile);
    //
    // };
}

module.exports = ReportPortalClient;