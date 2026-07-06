const request = require("supertest");
const app = require("../app");

describe("Authentication", () => {

    const user = {
        email: "owner@test.com",
        password: "Password123",
        businessName: "Coffee Shop"
    };

    test("POST /api/auth/register should register user", async () => {

        const res = await request(app)
            .post("/api/auth/register")
            .send(user);

        expect(res.statusCode).toBe(201);

        expect(res.body.status).toBe("success");

        expect(res.body.data.user.email).toBe(user.email);

        expect(res.body.data.token).toBeDefined();
    });

    test("duplicate email returns 400", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(user);

        const res = await request(app)
            .post("/api/auth/register")
            .send(user);

        expect(res.statusCode).toBe(400);

        expect(res.body.message)
            .toContain("already exists");
    });

    test("case-insensitive duplicate email returns 400", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({
                email: "CaseTest@test.com",
                password: "Password123",
                businessName: "Test Business"
            });

        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "casetest@test.com",
                password: "Password123",
                businessName: "Test Business 2"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message)
            .toContain("already exists");
    });

test("role field is rejected in registration (not in schema)", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "rolecheck@test.com",
                password: "Password123",
                businessName: "Test Business",
                role: "staff"
            });

        expect(res.statusCode).toBe(400);
    });

    test("user gets default role 'owner' on registration", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "roletest@test.com",
                password: "Password123",
                businessName: "Test Business"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.user.role).toBe("owner");
    });

    test("login success", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(user);

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: user.email,
                password: user.password
            });

        expect(res.statusCode).toBe(200);

        expect(res.body.data.token).toBeDefined();
    });

    test("wrong password", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(user);

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: user.email,
                password: "WrongPassword1"
            });

        expect(res.statusCode).toBe(400);
    });

    test("validation error", async () => {

        const res = await request(app)
            .post("/api/auth/register")
            .send({
                email: "abc",
                password: "123",
                businessName: ""
            });

        expect(res.statusCode).toBe(400);
    });

});