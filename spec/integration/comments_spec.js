const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics/";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;
const Comment = require("../../src/db/models").Comment;

describe("routes : comments", () => {

  beforeEach((done) => {

    this.user;
    this.topic;
    this.post;
    this.comment;

    sequelize.sync({force: true}).then((res) => {

      User.create({
        email: "starman@tesla.com",
        password: "Trekkie4lyfe"
      })
      .then((res) => {
        this.user = res;  // store user

        Topic.create({
          title: "Expeditions to Alpha Centauri",
          description: "A compilation of reports from recent visits to the star system.",
          posts: [{
            title: "My first visit to Proxima Centauri b",
            body: "I saw some rocks.",
            userId: this.user.id
          }]
        }, {
          include: {                        //nested creation of posts
            model: Post,
            as: "posts"
          }
        })
        .then((res) => {
          this.topic = res;                 // store topic
          this.post = this.topic.posts[0];  // store post

          Comment.create({
            body: "ay caramba!!!!!",
            userId: this.user.id,
            postId: this.post.id
          })
          .then((res) => {
            this.comment = res;             // store comment
            done();
          })
          .catch((err) => {
            console.log(err);
            done();
          });
        })
        .catch((err) => {
          console.log(err);
          done();
        });
      });
    });
  });

  describe("guest attempting to perform CRUD actions for Comment", () => {

    beforeEach((done) => {    // before each suite in this context
      const options = {
        url: "http://localhost:3000/auth/fake",
        form: {
          userId: 0
        }
      };

      request.get(options,
        (err, res, body) => {
          done();
        }
      );

    });

    describe("POST /topics/:topicId/posts/:postId/comments/create", () => {

      it("should not create a new comment", (done) => {
        const options = {
          url: `${base}${this.topic.id}/posts/${this.post.id}/comments/create`,
          form: {
            body: "This comment is amazing!"
          }
        };
        request.post(options,
          (err, res, body) => {
            Comment.findOne({where: {body: "This comment is amazing!"}})
            .then((comment) => {
              expect(comment).toBeNull();   // ensure no comment was created
              done();
            })
            .catch((err) => {
              console.log(err);
              done();
            });
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:postId/comments/:id/destroy", () => {

      it("should not delete the comment with the associated ID", (done) => {
        Comment.all()
        .then((comments) => {
          const commentCountBeforeDelete = comments.length;

          expect(commentCountBeforeDelete).toBe(1);

          request.post(
            `${base}${this.topic.id}/posts/${this.post.id}/comments/${this.comment.id}/destroy`,
            (err, res, body) => {
              Comment.all()
              .then((comments) => {
                expect(err).toBeNull();
                expect(comments.length).toBe(commentCountBeforeDelete);
                done();
              })

            });
          })
        });
      });
    });

  describe("signed in user performing CRUD actions for Comment", () => {

    beforeEach((done) => {    // before each suite in this context
      const options = {
        url: "http://localhost:3000/auth/fake",
        form: {
          userId: this.user.id,
          email: this.user.email,
          role: this.user.role
        }
      };

      request.get(options,
        (err, res, body) => {
          done();
        }
      );

    });

    describe("POST /topics/:topicId/posts/:postId/comments/create", () => {

      it("should create a new comment and redirect", (done) => {

        const options = {
          url: `${base}${this.topic.id}/posts/${this.post.id}/comments/create`,
          form: {
            body: "This comment is amazing!"
          }
        };
        request.post(options,
          (err, res, body) => {
            Comment.findOne({where: {body: "This comment is amazing!"}})
            .then((comment) => {
              expect(comment).not.toBeNull();
              expect(comment.body).toBe("This comment is amazing!");
              expect(comment.id).not.toBeNull();
              done();
            })
            .catch((err) => {
              console.log(err);
              done();
            });
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:postId/comments/:id/destroy", () => {

      it("should delete the comment with the associated ID", (done) => {
        Comment.all()
        .then((comments) => {
          const commentCountBeforeDelete = comments.length;

          expect(commentCountBeforeDelete).toBe(1);
          request.post(
            `${base}${this.topic.id}/posts/${this.post.id}/comments/${this.comment.id}/destroy`,
            (err, res, body) => {
              Comment.all()
              .then((comments) => {
                expect(err).toBeNull();
                expect(comments.length).toBe(commentCountBeforeDelete - 1);
                done();
              })

            });
          })

        });

        it("should not allow a non-admin user to delete a comment not owned by it", (done) => {
          User.create({
            email: "donttouchmycomment@example.com",
            password: "password"
          })
          .then((user) => {
            Comment.create({
              body: "This is the greatest comment ever.",
              userId: user.id,
              postId: this.post.id
            })
            .then((comment) => {
              expect(comment).not.toBeNull();
              expect(comment.userId).not.toBe(this.user.id);

              request.post(
                `${base}${this.topic.id}/posts/${this.post.id}/comments/${this.comment.id}/destroy`,
                (err, res, body) => {
                  Comment.findOne({ where: { body: "This is the greatest comment ever." }})
                  .then((comment) => {
                    expect(comment).not.toBeNull();
                    done();
                  });

                }
              );
            });
          });
        });

      });

    });

    describe("admin user attempting to delete a member's comment", () => {

      beforeEach((done) => {    // before each suite in this context
        const options = {
          url: "http://localhost:3000/auth/fake",
          form: {
            userId: this.user.id,
            email: this.user.email,
            role: "admin"
          }
        };

        request.get(options,
          (err, res, body) => {
            done();
          }
        );

      });

      describe("POST /topics/:topicId/posts/:postId/comments/:id/destroy", () => {

        it("should delete the comment with the associated ID", (done) => {
          User.create({
            email: "member@example.com",
            password: "password"
          })
          .then((user) => {
            Comment.create({
              body: "This comment is just ok." ,
              userId: user.id,
              postId: this.post.id
            })
            .then((comment) => {
              expect(comment).not.toBeNull();
              expect(comment.userId).not.toBe(this.user.id);

              request.post(
                `${base}${this.topic.id}/posts/${this.post.id}/comments/${this.comment.id}/destroy`,
                (err, res, body) => {
                  Comment.findOne({ where: { body: "This comment is just ok." }})
                  .then((comment) => {
                    expect(comment).not.toBeNull();
                    done();
                  })
                });

              })
            })


          });

        });



    });

});
