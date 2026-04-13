export type LinkListItem = {
  slug: string;
  destination: string;
  clickCount: number;
  createdAt: string;
};

export type LinkDetails = {
  slug: string;
  destinationUrl: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
};

export class LinksApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LinksApiError";
    this.statusCode = statusCode;
  }
}
