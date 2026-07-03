const request = require("supertest");
const app = require("../app");

let token;
let testimonialId;

const user = {
    email: "owner@test.com",
    password: "Password123",
    businessName: "Coffee Shop"
};

beforeEach(async () => {

    const register = await request(app)
        .post("/api/auth/register")
        .send(user);

    token = register.body.data.token;
});

describe("Testimonials", () => {

    test("create testimonial", async () => {

        const res = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John Doe",
                customerEmail: "john@test.com",
                rating: 5,
                text: "Amazing service",
                consentGiven: true
            });

        expect(res.statusCode).toBe(201);

        expect(res.body.status).toBe("success");

        expect(res.body.data.customerName).toBe("John Doe");

        testimonialId = res.body.data.testimonialId;
    });

    test("unauthorized create", async () => {

        const res = await request(app)
            .post("/api/testimonials")
            .send({
                customerName: "John"
            });

        expect(res.statusCode).toBe(401);
    });

    test("validation error", async () => {

        const res = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "A"
            });

        expect(res.statusCode).toBe(400);
    });

    test("get testimonials list", async () => {

        await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John",
                rating: 5
            });

        const res = await request(app)
            .get("/api/testimonials")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);

        expect(Array.isArray(res.body.data)).toBe(true);

        expect(res.body.pagination).toBeDefined();
    });

    test("get testimonial by id", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John",
                rating: 4
            });

        const id = created.body.data.testimonialId;

        const res = await request(app)
            .get(`/api/testimonials/${id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);

        expect(res.body.data.testimonialId).toBe(id);
    });

    test("update testimonial", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John",
                rating: 4
            });

        const id = created.body.data.testimonialId;

        const res = await request(app)
            .put(`/api/testimonials/${id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                rating: 5,
                text: "Excellent"
            });

        expect(res.statusCode).toBe(200);

        expect(res.body.data.rating).toBe(5);

        expect(res.body.data.text).toBe("Excellent");
    });

    test("delete testimonial", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John"
            });

        const id = created.body.data.testimonialId;

        const res = await request(app)
            .delete(`/api/testimonials/${id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);

        const deleted = await request(app)
            .get(`/api/testimonials/${id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleted.statusCode).toBe(404);
    });

    test("status transition draft -> recording", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John"
            });

        const id = created.body.data.testimonialId;

        const res = await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "recording"
            });

        expect(res.statusCode).toBe(200);

        expect(res.body.data.status).toBe("recording");
    });

    test("invalid status transition", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John"
            });

        const id = created.body.data.testimonialId;

        const res = await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "completed"
            });

        expect(res.statusCode).toBe(400);
    });

    test("share completed testimonial", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John"
            });

        const id = created.body.data.testimonialId;

        await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "recording" });

        await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "processing" });

        await request(app)
            .patch(`/api/testimonials/${id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "completed" });

        const res = await request(app)
            .post(`/api/testimonials/${id}/share`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                channels: ["email", "facebook"]
            });

        expect(res.statusCode).toBe(200);

        expect(res.body.data.status).toBe("shared");

        expect(res.body.data.sharedChannels.length).toBe(2);
    });

    test("share draft should fail", async () => {

        const created = await request(app)
            .post("/api/testimonials")
            .set("Authorization", `Bearer ${token}`)
            .send({
                customerName: "John"
            });

        const id = created.body.data.testimonialId;

        const res = await request(app)
            .post(`/api/testimonials/${id}/share`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                channels: ["email"]
            });

        expect(res.statusCode).toBe(400);
    });

    test("pagination works", async () => {

        for (let i = 0; i < 15; i++) {

            await request(app)
                .post("/api/testimonials")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    customerName: `Customer ${i}`
                });

        }

        const res = await request(app)
            .get("/api/testimonials?page=2&limit=10")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);

        expect(res.body.data.length).toBe(5);

        expect(res.body.pagination.page).toBe(2);
    });

});