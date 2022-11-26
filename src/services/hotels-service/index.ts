import { notFoundError, unauthorizedError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import hotelRepository from "@/repositories/hotel-repository";

async function getHotelList(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  const enrollmentId = enrollment.id;

  if(!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollmentId);
  if(ticket.status != "PAID" || !ticket.TicketType.includesHotel) {
    throw unauthorizedError(); 
  }

  const hotelList = await hotelRepository.findHotels();
  return hotelList;
}

async function getHotelByIdWithRooms(hotelId: number) {
  const hotelInfo = await hotelRepository.findHotelByIdWithRooms(hotelId);
  if(!hotelInfo) {
    throw notFoundError();
  }
    
  return hotelInfo;
}

const hotelService = {
  getHotelList,
  getHotelByIdWithRooms
};

export default hotelService;
