import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import hotelService from "@/services/hotels-service";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const hotelList = await hotelService.getHotelList(userId);

    return res.status(httpStatus.OK).send(hotelList);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
          
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function getHotelById(req: AuthenticatedRequest, res: Response) {
  try {
    const hotelId = Number(req.params.hotelId);
    if(!hotelId) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }

    const hotelData = await hotelService.getHotelByIdWithRooms(hotelId);
        
    return res.status(httpStatus.OK).send(hotelData);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}
