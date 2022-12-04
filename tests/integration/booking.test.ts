import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicket,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createTicketTypePresential,
  createHotel,
  createRoomWithHotelId,
  createRoomWithHotelIdCapacityOne,
} from "../factories";
import { x } from "joi";
import { createGenericBooking, findBookingById, findBookingByUserId } from "../factories/booking-factory";

beforeAll(async () => {
  await init();
});
  
beforeEach(async () => {
  await cleanDb();
});
  
const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and bookingId when user has booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelIdCapacityOne(createdHotel.id);
      const userId = user.id;
      const roomId = createdRoom.id;
      await createGenericBooking(userId, roomId);
      const bookingData = await findBookingByUserId(user.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: bookingData.id,
        Room: {
          id: bookingData.Room.id,
          name: bookingData.Room.name,
          capacity: bookingData.Room.capacity,
          hotelId: bookingData.Room.hotelId,
          createdAt: bookingData.Room.createdAt.toISOString(),
          updatedAt: bookingData.Room.updatedAt.toISOString()
        }
      });
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 400 when body is not given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when body is not valid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
        
      const response = await server.post("/booking").send(invalidBody).set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    describe("when body is valid", () => {
      const generateValidBody = () => ({
        roomId: faker.datatype.number({ min: 1 }),
      });

      it("should respond with status 403 when user ticket is remote", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const body = generateValidBody();
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when user ticket has no hotel included", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypePresential();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const body = generateValidBody();
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when user ticket is not paid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const body = generateValidBody();
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 404 when roomId is not registered - VALID PARTITION", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const createdHotel = await createHotel();
        await createRoomWithHotelId(createdHotel.id); 
        const body = { roomId: faker.datatype.number({ min: 1000000 }) };
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      it("should respond with status 400 when roomId is not a valid index - INVALID PARTITION", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const createdHotel = await createHotel();
        await createRoomWithHotelId(createdHotel.id); 
        const body = { roomId: 0 };
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });
    
      it("should respond with status 403 when room capacity is full", async () => {
        const user = await createUser();
        const user2 = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelIdCapacityOne(createdHotel.id);
        await createGenericBooking(user2.id, createdRoom.id); 
        const body = { roomId: createdRoom.id };
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 200 and bookingId", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const body = { roomId: createdRoom.id };
    
        const response = await server.post("/booking").send(body).set("Authorization", `Bearer ${token}`);

        const result = await prisma.booking.findFirst({ where: { userId: user.id } });
        expect(result.roomId).toBe(createdRoom.id);

        expect(response.status).toEqual(httpStatus.OK);
        expect(response.body).toEqual({
          bookingId: expect.any(Number),
        });
      });
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.put("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.put("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    const generateValidBody = () => ({
      roomId: faker.datatype.number({ min: 2 }),
    });
    it("should respond with status 400 when body is not given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when body is not valid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
        
      const response = await server.put("/booking/1").send(invalidBody).set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when no param is given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = generateValidBody();
        
      const response = await server.put(`/booking/:${""}`).send(body).set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when no param's bookingId is invalid index - INVALID PARTITION", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = generateValidBody();
        
      const response = await server.put("/booking/0").send(body).set("Authorization", `Bearer ${token}`);
        
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    describe("when body and param are valid", () => {
      it("should respond with status 404 when roomId is not registered - VALID PARTITION", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const booking = await createGenericBooking(user.id, createdRoom.id); 
        const body = generateValidBody();
    
        const response = await server.put(`/booking/${booking.id}`).send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      it("should respond with status 400 when roomId is invalid index - INVALID PARTITION", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const booking = await createGenericBooking(user.id, createdRoom.id); 
        const body = { roomId: 0 };
    
        const response = await server.put(`/booking/${booking.id}`).send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });

      it("should respond with status 403 when user has no booking", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = generateValidBody();

        const response = await server.put("/booking/1").send(body).set("Authorization", `Bearer ${token}`);
        
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when room capacity is full", async () => {
        const user = await createUser();
        const user2 = await createUser();
        const token = await generateValidToken(user);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelIdCapacityOne(createdHotel.id);
        const booking = await createGenericBooking(user2.id, createdRoom.id); 
        const body = { roomId: createdRoom.id };
    
        const response = await server.put(`/booking/${booking.id}`).send(body).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 200 and bookingId", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
        const booking = await createGenericBooking(user.id, createdRoom.id); 
        const body = { roomId: createdRoom2.id };
    
        const response = await server.put(`/booking/${booking.id}`).send(body).set("Authorization", `Bearer ${token}`);
        
        const result = await prisma.booking.findUnique({ where: { id: booking.id } });
        expect(result.roomId).toBe(createdRoom2.id);

        expect(response.status).toEqual(httpStatus.OK);
        expect(response.body).toEqual({
          bookingId: booking.id,
        });
      });
    });
  });
});
