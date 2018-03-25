const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/";

describe("routes : static", () => {

//#1
  describe("GET /", () => {

//#2
    it("should return status code 200", (done) => {

//#3
      request.get(base, (err, res, body) => {
        expect(res.statusCode).toBe(200);
        expect(body).toContain("Welcome to Bloccit");
        done();
      });
    });

  });

  describe("GET /marco", () => {

  it("should returns a status code 200", () => {
    request.get(`${base}marco`, (err, res, body) => {
      expect(res.statusCode).toBe(200);
    });
  });

  it("should have 'Welcome to Bloccit' in the body of the response", () => {
    request.get(`${base}marco`, (err, res, body) => {
      expect(body).toBe("polo");
    });
  });

});

  describe("GET /about", () => {

    it("should return 200 and have 'Welcome to Bloccit' in the body of the response", () => {
      request.get(`${base}about`, (err, res, body) => {
        expect(res.statusCode).toBe(200);
        expect(body).toContain("About Us");
      });
    });

  });
});
