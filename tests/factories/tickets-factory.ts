import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { TicketStatus } from "@prisma/client";

export async function createTicketType() {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: faker.datatype.boolean(),
      includesHotel: faker.datatype.boolean(),
    },
  });
}

export async function createTicket(enrollmentId: number, ticketTypeId: number, status: TicketStatus) {
  return prisma.ticket.create({
    data: {
      enrollmentId,
      ticketTypeId,
      status,
    },
  });
}

export async function updateTicketTypeIncludesHotel(ticketTypeId: number, includesHotel: boolean) {
  return prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: { includesHotel: includesHotel }
  });
}

export async function updateTicketTypeIsRomote(ticketTypeId: number, isRemote: boolean) {
  return prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: { isRemote: isRemote }
  });
}

