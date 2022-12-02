import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getBookings(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = bookingService.getBookings(Number(userId));
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  if(!roomId) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
    
  try {
    const postedBooking = await bookingService.postBooking(userId, roomId);
    return res.status(httpStatus.OK).send(postedBooking);
  } catch (error) {
    if (error.name === "CannotBookRoomError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
          
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { bookingId } = req.params;
  const { roomId } = req.body;

  if(!bookingId || !roomId) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
    
  try {
    const updatedBooking = await bookingService.putBooking(userId, roomId, Number(bookingId));
    return res.status(httpStatus.OK).send(updatedBooking);
  } catch (error) {
    if (error.name === "CannotBookRoomError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
          
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}