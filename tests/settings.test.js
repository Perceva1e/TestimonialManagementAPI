const request = require("supertest");
const app = require("../app");

let token;

beforeEach(async () => {

    const register = await request(app)
        .post("/api/auth/register")
        .send({
            email: "settings@test.com",
            password: "Password123",
            businessName: "Coffee"
        });

    token = register.body.data.token;
});

describe("Settings API", () => {

    test("GET settings returns null initially", async () => {

        const res = await request(app)
            .get("/api/testimonials/settings")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);

        expect(res.body.data).toBeNull();
    });

    test("create settings", async () => {

        const body = {
            isEnabled: true,
            defaultVideoLength: 20,
            videoLengthOptions: [10,20,30],
            questionnaire: [
                "How was our service?"
            ],
            sendingOptions: [
                "email",
                "sms"
            ],
            thankYouMessage: "Thank you!",
            contactConsent: {
                enabled: true,
                text: "Subscribe"
            }
        };

        const res = await request(app)
            .post("/api/testimonials/settings")
            .set("Authorization", `Bearer ${token}`)
            .send(body);

        expect(res.statusCode).toBe(200);

        expect(res.body.data.isEnabled).toBe(true);

        expect(res.body.data.defaultVideoLength).toBe(20);

    });

    test("update existing settings", async () => {

        await request(app)
            .post("/api/testimonials/settings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                isEnabled: true
            });

        const res = await request(app)
            .post("/api/testimonials/settings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                thankYouMessage: "Updated message"
            });

        expect(res.statusCode).toBe(200);

        expect(res.body.data.thankYouMessage)
            .toBe("Updated message");

    });

    test("invalid settings validation", async () => {

        const res = await request(app)
            .post("/api/testimonials/settings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                defaultVideoLength: 200
            });

        expect(res.statusCode).toBe(400);

    });

test("unauthorized request", async () => {

        const res = await request(app)
            .get("/api/testimonials/settings");

        expect(res.statusCode).toBe(401);

    });

    test("empty body should be rejected", async () => {

        const res = await request(app)
            .post("/api/testimonials/settings")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.statusCode).toBe(400);

    });

});
