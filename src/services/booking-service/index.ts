import bookingRepository from "@/repositories/booking-repository";
import { cannotBookRoomError, notFoundError } from "@/errors";
import roomRepository from "@/repositories/room-repository";
import ticketRepository from "@/repositories/ticket-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";

async function getBookings(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) {
    throw notFoundError();
  }

  return booking;
}

async function postBooking(userId: number, roomId: number) {
  await bookRoomPermissionCheck(userId);
    
  await roomAvailabilityCheck(roomId);

  const newBooking = await bookingRepository.createBooking(userId, roomId);
  return newBooking.id;
}

async function putBooking(userId: number, roomId: number, bookingId: number) {
  const userBooking = await bookingRepository.findBookingByUserId(userId);
  if(!userBooking) {
    throw cannotBookRoomError();
  }

  await roomAvailabilityCheck(roomId);

  const updatedBooking = await bookingRepository.updateBooking(bookingId, roomId);
  return updatedBooking.id;
}

async function bookRoomPermissionCheck(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  const enrollmentId = enrollment.id;
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollmentId);

  if(!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw cannotBookRoomError();
  }
}

async function roomAvailabilityCheck(roomId: number) {
  const room = await roomRepository.findRoomById(roomId);
  if(!room) {
    return notFoundError();
  }

  const bookingsByRoomId = await bookingRepository.findAllBookingsByRoomId(roomId);

  if(room.capacity <= bookingsByRoomId.length) {
    throw cannotBookRoomError(); 
  }
}

const bookingService = {
  getBookings,
  postBooking,
  putBooking
};

export default bookingService;
