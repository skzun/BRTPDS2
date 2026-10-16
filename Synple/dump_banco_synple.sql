--
-- PostgreSQL database dump
--

\restrict 34nJCl3dAAdaH1sruJElURPwnoZDHSTFbKSZU8fGccRA4lnjhcY1W7Kbsugl4y2

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    organization_role character varying(30) DEFAULT 'MEMBER'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.access_requests OWNER TO postgres;

--
-- Name: commission_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_members (
    commission_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'MEMBER'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.commission_members OWNER TO postgres;

--
-- Name: commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(120) NOT NULL,
    type character varying(50) DEFAULT 'Comissão'::character varying NOT NULL,
    description text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.commissions OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    document character varying(18) NOT NULL,
    owner_id uuid NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: system_subsystems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_subsystems (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'ONLINE'::character varying NOT NULL,
    last_check timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_subsystems OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    system_role character varying(30) DEFAULT 'USER'::character varying NOT NULL,
    theme character varying(10) DEFAULT 'LIGHT'::character varying NOT NULL,
    reset_token character varying(255),
    reset_token_expires timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: access_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access_requests (id, organization_id, user_id, status, organization_role, created_at, updated_at) FROM stdin;
fac17ccd-34c5-4953-9edf-301bb98e9e83	ffdf8edd-bf43-4b3d-88dc-c6eb3c20e6b0	664896be-6b1b-458b-9955-fa296d967c31	PENDING	MEMBER	2026-09-25 20:32:44.914437+00	2026-09-25 20:32:44.914437+00
\.


--
-- Data for Name: commission_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_members (commission_id, user_id, role, created_at) FROM stdin;
311a0414-8ba7-4d69-ac4f-f170d0f32ca0	7476a3c2-1d01-4954-bb9a-ac1655c70f87	COORDINATOR	2026-09-25 20:32:44.918644+00
\.


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commissions (id, organization_id, name, type, description, status, created_at, updated_at) FROM stdin;
311a0414-8ba7-4d69-ac4f-f170d0f32ca0	ffdf8edd-bf43-4b3d-88dc-c6eb3c20e6b0	Comunicação	Comissão	Divulgação e relacionamento com a comunidade.	ACTIVE	2026-09-25 20:32:44.917448+00	2026-09-25 20:32:44.917448+00
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, document, owner_id, status, created_at, updated_at) FROM stdin;
c5bdc29d-e3d8-490a-8c4b-dfbff40575e1	Coletivo Horizonte	98.765.432/0001-10	7476a3c2-1d01-4954-bb9a-ac1655c70f87	APPROVED	2026-09-25 20:32:44.912348+00	2026-09-25 20:32:44.912348+00
ffdf8edd-bf43-4b3d-88dc-c6eb3c20e6b0	Estúdio Aurora	12.345.678/0001-90	7476a3c2-1d01-4954-bb9a-ac1655c70f87	APPROVED	2026-09-25 20:32:44.910471+00	2026-09-25 20:32:44.910471+00
\.


--
-- Data for Name: system_subsystems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_subsystems (id, name, status, last_check) FROM stdin;
api	API e Autenticação (Node.js/Express)	ONLINE	2026-09-25 23:15:57.253732+00
database	Banco de Dados (PostgreSQL 18 - Banco_synple)	ONLINE	2026-09-25 23:15:57.257098+00
notifications	Serviço de Notificações e Fila	ONLINE	2026-09-25 23:15:57.259157+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, system_role, theme, reset_token, reset_token_expires, created_at, updated_at) FROM stdin;
3a2cebc8-66dc-4dcb-b64f-2d40fa523686	Aaaaaaaa	aaaa@gmail.com	(13) 23233-5838	$2a$10$csVo7p9TtGcLqr6IrbNrQ.a1wmICgH4z1fPntBtMXq6B6j/KMPcvK	USER	LIGHT	\N	\N	2026-09-25 20:34:21.287804+00	2026-09-25 20:34:21.287804+00
05567e66-f417-43b6-aa53-12b789f9e0d3	Testeeeee	testeee@gmail.com	(26) 29292-9295	$2a$10$c5LlOfGH/ZECocV8FdEXWuakP/rlgPcRIpvas8NUrgeg9cz0DlfWq	USER	LIGHT	\N	\N	2026-09-25 20:34:21.360652+00	2026-09-25 20:34:21.360652+00
f3b51612-e4a7-4966-a5b1-e7c0589fa7d1	Systtsysys	testeeeee@gmail.com	(51) 9292-6295	$2a$10$kh3ZXuNlbPMeKz0H2txiVe4aoVSUgHagR2l1WRld9QsSs6OcKGv1K	USER	LIGHT	\N	\N	2026-09-25 20:34:21.42821+00	2026-09-25 20:34:21.42821+00
2254493d-8178-4661-99d4-7b2f6c86400d	Casa	casa@gmail.com	(46) 46566-5656	$2a$10$1DpnTcFXZaUWrxDDCnerduUlNBJcHF54dvq0JEGyivgdeFX0FkqP2	USER	LIGHT	\N	\N	2026-09-25 20:34:21.49262+00	2026-09-25 20:34:21.49262+00
3abdcf55-bf95-4ce2-b770-ca25ca2efa1f	Casaaa	casaa@gmail.com	(59) 89898-9895	$2a$10$IDM.RKTnPFO7/02Qzuy2o.t5YUVmZhenvcnc.H2SDHnycCq7htjQC	USER	LIGHT	\N	\N	2026-09-25 20:34:21.559992+00	2026-09-25 20:34:21.559992+00
bafa2e4b-facc-414e-ba54-061663e18218	Foraderede	forarede@gmail.com	(12) 34454-5455	$2a$10$X5718qM39sQI5GYI.9r/3OaQq4aAJY0kFY173RfXCWMUewGPBISR6	USER	LIGHT	\N	\N	2026-09-25 20:34:21.627622+00	2026-09-25 20:34:21.627622+00
967e6e05-b393-481a-bbb9-69e420283dd3	Forarede	foraredee@gmail.com	(56) 68656-5656	$2a$10$FULe5nloRC5LoqHpSm4NEunOEv2fA8GHdImE2thE7l4nwk/ZXKTl.	USER	LIGHT	\N	\N	2026-09-25 20:34:21.700184+00	2026-09-25 20:34:21.700184+00
3a7da232-7dcb-4271-90e5-d1916755a6b5	Refefora	redeforaa@gmail.com	(62) 68386-8686	$2a$10$XAUh8m9DooftCJXIcnkIru7f1SVLfE7jfhDsACb8MrcYInxS5qNSi	USER	LIGHT	\N	\N	2026-09-25 20:34:21.772017+00	2026-09-25 20:34:21.772017+00
c3362c7c-2dd0-4f21-bd12-6ee14afea866	Foraaaa	fora@gmail.com	(12) 34346-4646	$2a$10$tRU.kBYxwJ3QjqFdUAer2uJHRTK0K2et7c.beGgOv0bimY8oM3bSy	USER	LIGHT	\N	\N	2026-09-25 20:34:21.843947+00	2026-09-25 20:34:21.843947+00
d96e709b-0a4f-4e59-8aa0-c5bb953cf310	Docker	docker@gmail.com	(11) 11111-1111	$2a$10$A05I3QPZMY.VtdqljPVUzeFcHs6Yg1ilo4wHzhCcKmVUgNUSpZx.G	USER	LIGHT	\N	\N	2026-09-25 20:42:29.0232+00	2026-09-25 20:42:29.0232+00
de57fd7f-233b-437f-ab8f-96d744e5f472	Administrador do Sistema	admin@synple.com	(11) 99999-1111	$2a$10$NFTvFcOzAJxl8wYlFnlKde4h89Zt3MD4F2g/LytZmUQPa.6GW3COW	SYSTEM_ADMIN	LIGHT	\N	\N	2026-09-25 20:32:44.9046+00	2026-09-25 20:32:44.9046+00
7476a3c2-1d01-4954-bb9a-ac1655c70f87	Marina Costa	marina@synple.com	(11) 99999-0000	$2a$10$fEIOqGMU1QiddynrVP724OnkqQcKd76GatCKUDF3IPXw2S1NFY7ei	USER	LIGHT	\N	\N	2026-09-25 20:32:44.906981+00	2026-09-25 20:32:44.906981+00
664896be-6b1b-458b-9955-fa296d967c31	João Silva	joao@synple.com	(11) 98888-2222	$2a$10$yFADzOHVt2oAs.tmPH0ag.JZ7PQyIjPHqm9wS.yGhypJQbJcxSRF6	USER	LIGHT	\N	\N	2026-09-25 20:32:44.909447+00	2026-09-25 20:32:44.909447+00
effd3449-d9f9-4005-b8af-82da8bda91b9	Casaaaaa	cassaaa@gmail.com	(65) 65656-5656	$2a$10$6xvJ3/KTQr.vFpr6eD6YqedmIycRPE0KVqGCeWVD7VMqw0tlNjiFO	USER	LIGHT	\N	\N	2026-10-02 20:27:49.970748+00	2026-10-02 20:27:49.970748+00
\.


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: commission_members commission_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_pkey PRIMARY KEY (commission_id, user_id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_document_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_document_key UNIQUE (document);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: system_subsystems system_subsystems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_subsystems
    ADD CONSTRAINT system_subsystems_pkey PRIMARY KEY (id);


--
-- Name: access_requests uq_access_request_org_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT uq_access_request_org_user UNIQUE (organization_id, user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_access_requests_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_requests_org ON public.access_requests USING btree (organization_id);


--
-- Name: idx_access_requests_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_requests_user ON public.access_requests USING btree (user_id);


--
-- Name: idx_comm_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comm_members_user ON public.commission_members USING btree (user_id);


--
-- Name: idx_commissions_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commissions_org ON public.commissions USING btree (organization_id);


--
-- Name: idx_organizations_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizations_owner ON public.organizations USING btree (owner_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: access_requests access_requests_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: access_requests access_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commission_members commission_members_commission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_commission_id_fkey FOREIGN KEY (commission_id) REFERENCES public.commissions(id) ON DELETE CASCADE;


--
-- Name: commission_members commission_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_members
    ADD CONSTRAINT commission_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 34nJCl3dAAdaH1sruJElURPwnoZDHSTFbKSZU8fGccRA4lnjhcY1W7Kbsugl4y2

