const sequelize = require("../../src/db/models/index").sequelize;
const Flair = require("../../src/db/models").Flair;

describe("Flair", () => {

  beforeEach((done) => {

    this.flair;

    sequelize.sync({force: true}).then((res) => {
      Flair.create({
        name: "Finance",
        color: "purple"
      })
      .then((flair) => {
        this.flair = flair;

        done();
      })
      .catch((err) => {
        console.log(err);
        done();
      });
    });

  });

  describe("#create()", () => {

    it("should create a flair object with a name and color", (done) => {

      Flair.create({
        name: "Engineering",
        color: "blue"
      })
      .then((flair) => {

        expect(flair.name).toBe("Engineering");
        expect(flair.color).toBe("blue");
        done();

      })
      .catch((err) => {
        console.log(err);
        done();
      });
    });

    it("should not create a flair with invalid attributes", (done) => {
      Flair.create({
        name: "Woodworking"
      })
      .then((flair) => {

        // the code in this block will not be evaluated since the validation error
        // will skip it. Instead, we'll catch the error in the catch block below
        // and set the expectations there

        done();

      })
      .catch((err) => {

        expect(err.message).toContain("Flair.color cannot be null");
        done();

      })
    });

  });

});
