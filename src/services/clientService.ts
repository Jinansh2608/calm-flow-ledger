import { apiRequest } from "./api";
import { Client, StandardResponse } from "@/types";

interface ClientsResponse {
  clients: Client[];
  count: number;
}

// Fallback clients if API call fails
const FALLBACK_CLIENTS: Client[] = [
  { id: 1, name: "Bajaj" },
  { id: 2, name: "Dava India" }
];

export const clientService = {
  getAllClients: async (): Promise<StandardResponse<ClientsResponse>> => {
    try {
      const response = await apiRequest<ClientsResponse>("/clients");
      
      // Ensure we have valid clients data
      if (response.status === "SUCCESS" && response.data?.clients && response.data.clients.length > 0) {
        return response;
      }
      
      // If no clients returned from API, use fallback
      return {
        status: "SUCCESS",
        data: {
          clients: FALLBACK_CLIENTS,
          count: FALLBACK_CLIENTS.length
        }
      };
    } catch (error) {
      console.warn("Failed to fetch clients from API, using fallback:", error);
      // Return fallback clients on error
      return {
        status: "SUCCESS",
        data: {
          clients: FALLBACK_CLIENTS,
          count: FALLBACK_CLIENTS.length
        }
      };
    }
  },
  
  // Get fallback clients directly (useful for initialization)
  getFallbackClients: (): Client[] => {
    return FALLBACK_CLIENTS;
  },

  getClientPO: async (clientPoId: number) => {
    try {
      const response = await apiRequest<any>(`/client-po/${clientPoId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch client PO ${clientPoId}:`, error);
      throw error;
    }
  }
};
