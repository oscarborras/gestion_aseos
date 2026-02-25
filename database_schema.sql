-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alumnos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  curso_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alumnos_pkey PRIMARY KEY (id),
  CONSTRAINT alumnos_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id)
);
CREATE TABLE public.aseos (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  estado_id integer,
  ocupado_por text,
  curso_alumno text,
  ultimo_cambio timestamp with time zone DEFAULT now(),
  motivo_mantenimiento text,
  CONSTRAINT aseos_pkey PRIMARY KEY (id),
  CONSTRAINT aseos_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.estados(id)
);
CREATE TABLE public.cursos (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL UNIQUE,
  CONSTRAINT cursos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.estados (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  CONSTRAINT estados_pkey PRIMARY KEY (id)
);
CREATE TABLE public.registros (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumno_id uuid NOT NULL,
  aseo_id integer NOT NULL,
  fecha_entrada timestamp with time zone NOT NULL DEFAULT now(),
  fecha_salida timestamp with time zone,
  estado_salida text CHECK (estado_salida = ANY (ARRAY['Bueno'::text, 'Regular'::text, 'Malo'::text])),
  observaciones_entrada text,
  observaciones_salida text,
  CONSTRAINT registros_pkey PRIMARY KEY (id),
  CONSTRAINT registros_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id),
  CONSTRAINT registros_aseo_id_fkey FOREIGN KEY (aseo_id) REFERENCES public.aseos(id)
);

CREATE TABLE public.lista_espera (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  alumno_id uuid NOT NULL,
  fecha_solicitud timestamp with time zone NOT NULL DEFAULT now(),
  estado text NOT NULL DEFAULT 'esperando' CHECK (estado IN ('esperando', 'notificado', 'en_uso', 'completado', 'cancelado')),
  CONSTRAINT lista_espera_pkey PRIMARY KEY (id),
  CONSTRAINT lista_espera_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id)
);

CREATE TABLE public.perfiles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL UNIQUE,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT perfiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  perfil_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, perfil_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES public.perfiles(id)
);
