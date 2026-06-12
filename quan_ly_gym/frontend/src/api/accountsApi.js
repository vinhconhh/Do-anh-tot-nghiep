import axiosClient from "./axiosClient";

const accountsApi = {
  getAccounts: (params = {}) => {
    return axiosClient.get("/accounts", { params });
  },

  getAccount: (id) => {
    return axiosClient.get(`/accounts/${id}`);
  },

  createAccount: (data) => {
    return axiosClient.post("/accounts", data);
  },

  updateAccount: (id, data) => {
    return axiosClient.put(`/accounts/${id}`, data);
  },

  deleteAccount: (id) => {
    return axiosClient.delete(`/accounts/${id}`);
  },

  toggleStatus: (id) => {
    return axiosClient.put(`/accounts/${id}/toggle-status`);
  },

  getRoles: () => {
    return axiosClient.get("/accounts/roles");
  },
};

export default accountsApi;
