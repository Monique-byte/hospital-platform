import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicLayout } from "@/components/PublicLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { Login } from "@/pages/auth/Login";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { Directory } from "@/pages/employees/Directory";
import { Profile } from "@/pages/employees/Profile";
import { EmployeeForm } from "@/pages/employees/EmployeeForm";
import { PublicHome } from "@/pages/public/PublicHome";
import { PublicationsList } from "@/pages/public/PublicationsList";
import { PublicationDetail } from "@/pages/public/PublicationDetail";
import { SpecialtiesPage } from "@/pages/public/SpecialtiesPage";
import { InstitutionalPage } from "@/pages/public/InstitutionalPage";
import { DocumentList } from "@/pages/documents/DocumentList";
import { DocumentForm } from "@/pages/documents/DocumentForm";
import { DocumentDetail } from "@/pages/documents/DocumentDetail";
import { DocumentEditForm } from "@/pages/documents/DocumentEditForm";
import { PublicationAdminList } from "@/pages/admin/publications/PublicationAdminList";
import { PublicationForm } from "@/pages/admin/publications/PublicationForm";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <PublicHome /> },
      { path: "/especialidades", element: <SpecialtiesPage /> },
      { path: "/institucional/:slug", element: <InstitutionalPage /> },
      { path: "/publicacoes", element: <PublicationsList /> },
      { path: "/publicacoes/:id", element: <PublicationDetail /> },
    ],
  },

  { path: "/login", element: <Login /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/funcionarios", element: <Directory /> },
          { path: "/funcionarios/novo", element: <EmployeeForm /> },
          { path: "/funcionarios/:id", element: <Profile /> },
          { path: "/funcionarios/:id/editar", element: <EmployeeForm /> },
          { path: "/documentos", element: <DocumentList /> },
          { path: "/documentos/novo", element: <DocumentForm /> },
          { path: "/documentos/:id", element: <DocumentDetail /> },
          { path: "/documentos/:id/editar", element: <DocumentEditForm /> },
          { path: "/admin/publicacoes", element: <PublicationAdminList /> },
          { path: "/admin/publicacoes/nova", element: <PublicationForm /> },
          { path: "/admin/publicacoes/:id/editar", element: <PublicationForm /> },
          
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);