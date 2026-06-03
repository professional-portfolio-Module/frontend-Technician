import apiClient from "./api";

export interface ReportPayload {
  hotel_id: string;
  technician_id: string;
  report_text: string;
  is_critical: boolean;
}

export interface ReportItem {
  id: string;
  hotel_id: string;
  technician_id: string;
  technician_name?: string;
  technician_email?: string;
  report_text: string;
  is_critical: boolean;
  recipient_role: "engineer" | "manager";
  created_at: string;
}

export const reportService = {
  submitReport: async (payload: ReportPayload): Promise<ReportItem> => {
    const response = await apiClient.post("/Main/router-backend/api/technician-reports", payload);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Failed to submit weekly report");
  },

  getRecentReports: async (hotelId: string, technicianId: string): Promise<ReportItem[]> => {
    const response = await apiClient.get("/Main/router-backend/api/technician-reports", {
      params: { hotel_id: hotelId, technician_id: technicianId }
    });
    return response.data?.data || [];
  }
};

export default reportService;
