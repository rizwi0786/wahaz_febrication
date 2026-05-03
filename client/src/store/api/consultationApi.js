import { api } from './baseApi';

export const consultationApi = api.injectEndpoints({
  endpoints: (b) => ({
    createConsultation: b.mutation({
      query: (body) => ({ url: '/consultations', method: 'POST', body }),
      invalidatesTags: ['Consultation'],
    }),
    myConsultations: b.query({
      query: () => '/consultations',
      providesTags: ['Consultation'],
    }),
    cancelConsultation: b.mutation({
      query: (id) => ({ url: `/consultations/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Consultation'],
    }),

    // Admin
    adminListConsultations: b.query({
      query: (params = {}) => ({ url: '/admin/consultations', params }),
      providesTags: ['Consultation'],
    }),
    adminGetConsultation: b.query({
      query: (id) => `/admin/consultations/${id}`,
      providesTags: (r, e, id) => [{ type: 'Consultation', id }],
    }),
    adminConfirmConsultation: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/consultations/${id}/confirm`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Consultation'],
    }),
    adminCancelConsultation: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/consultations/${id}/cancel`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Consultation'],
    }),
    adminCompleteConsultation: b.mutation({
      query: (id) => ({ url: `/admin/consultations/${id}/complete`, method: 'PUT' }),
      invalidatesTags: ['Consultation'],
    }),
  }),
});

export const {
  useCreateConsultationMutation,
  useMyConsultationsQuery,
  useCancelConsultationMutation,
  useAdminListConsultationsQuery,
  useAdminGetConsultationQuery,
  useAdminConfirmConsultationMutation,
  useAdminCancelConsultationMutation,
  useAdminCompleteConsultationMutation,
} = consultationApi;
