export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBookVolume[];
}

export async function searchGoogleBooks(
  query: string
): Promise<GoogleBookVolume[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&key=${apiKey}`
  );

  if (!res.ok) {
    throw new Error("Google Books API request failed");
  }

  const data: GoogleBooksResponse = await res.json();
  return data.items ?? [];
}
