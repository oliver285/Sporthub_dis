// ********************** Initialize server **********************************

const server = require("../src/index"); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require("chai"); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;
const app = require("../src/index");

// ********************** DEFAULT WELCOME TESTCASE ****************************

// describe('Server!', () => {
//   // Sample test case given to test / endpoint.
//   it('Returns the default welcome message', done => {
//     chai
//       .request(server)
//       .get('/welcome')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'Welcome!');
//         done();
//       });
//   });
// });

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************

describe("Testing Registration", () => {
  it("positive : /register", (done) => {
    chai
      .request(server)
      .post("/register")
      .send({
        first_name: "joes",
        last_name: "burnas",
        username: "joeyba",
        email: "j@emials.com",
        password: "getmoneyd",
      })
      .end((err, res) => {
        if (err) done(err);
        // Check the status code
        expect(res).to.have.status(200);
        // Check the content type
        expect(res).to.have.header("content-type", /html/);
        // Check the response text
        expect(res.text).to.include("Successfully registered");
        done();
      });
  });

  // Negative test case
  it("Negative : /register with invalid input", (done) => {
    chai
      .request(server)
      .post("/register")
      .send({
        first_name: "",
        last_name: "burns",
        username: "1234",
        email: "invalid-email",
        password: "short",
      })
      .end((err, res) => {
        if (err) done(err);
        // Check the status code
        expect(res).to.have.status(400);
        // Check the content type
        expect(res).to.have.header("content-type", /html/);
        // Check the response text
        expect(res.text).to.include("All fields are required.");
        done();
      });
  });
});

describe("logout", () => {
  it("positive: /logout", (done) => {
    chai
      .request(server)
      .get("/logout")
      .end((err, res) => {
        if (err) done(err);
        // Check the status code
        expect(res).to.have.status(200);
        // Check the content type
        expect(res).to.have.header("content-type", /html/);
        // Check the response text
        expect(res.text).to.include("You have been logged out successfully!");
        done();
      });
  });
});

describe("Session Management", () => {
  let agent;
  let server;

  // Start the server before running tests
  before((done) => {
    server = app.listen(1234, () => {
      console.log("Test server running on port 1234");
      agent = chai.request.agent(server);
      done();
    });
  });

  // Login and store session
  beforeEach((done) => {
    agent
      .post("/login")
      .send({ username: "mich8112", password: "1234" })
      .end((err, res) => {
        if (err) done(err);
        expect(res).to.have.status(200);
        //   expect(res.text).to.include('Successfully logged in.');
        done();
      });
  });

  // Test to check if session is active
  it("should have an active session", (done) => {
    agent.get("/profile").end((err, res) => {
      if (err) done(err);
      expect(res).to.have.status(200);
      //  expect(res.text).to.include('Successfully logged in.');
      done();
    });
  });

  // Logout and destroy session
  afterEach((done) => {
    agent.get("/logout").end((err, res) => {
      if (err) done(err);
      expect(res).to.have.status(200);
      expect(res).to.have.header("content-type", /html/);
      expect(res.text).to.include("You have been logged out successfully!");
      done();
    });
  });

  // Stop the server after running tests
  after((done) => {
    server.close(() => {
      console.log("Test server stopped");
      done();
    });
  });
});
