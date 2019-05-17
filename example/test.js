"use strict";

const expect = require("chai").expect;

describe("describe", function() {

    before(function () {
        const foo = "bar";
    });

    beforeEach(function () {
        const foo = "bar";
    });

    describe("nested describe", function () {

        before(function () {
            const foo = "bar";
        });

        beforeEach(function () {
            const foo = "bar";
        });

        it("test pass in nested describe", function() {
            expect(true).to.be.equal(true);
        });

        it("test fail in nested describe", function() {
            expect(true).to.be.equal(false);
        });

        it("test pending in nested describe");

        after("named hook", function () {
            const foo = "bar";
        });

        afterEach(function () {
            const foo = "bar";
        });

    });

    it("test pass", function() {
        expect(true).to.be.equal(true);
    });

    it("test fail", function() {
        expect(true).to.be.equal(false);
    });

    it("test pending");

    after(function () {
        const foo = "bar";
    });

    afterEach(function () {
        const foo = "bar";
    });

});
