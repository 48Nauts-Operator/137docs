--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.8 (Debian 16.8-1.pgdg120+1)

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

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: address_book; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.address_book (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    entity_type character varying(20),
    email character varying(255),
    phone character varying(50),
    street character varying(255),
    address2 character varying(255),
    town character varying(255),
    zip character varying(20),
    county character varying(100),
    country character varying(100),
    group_name character varying(100),
    last_transaction character varying(50),
    address text,
    vat_id character varying(50),
    bank_details text,
    tags character varying(255),
    created_from character varying(255),
    last_seen_in character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.address_book OWNER TO postgres;

--
-- Name: address_book_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.address_book_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.address_book_id_seq OWNER TO postgres;

--
-- Name: address_book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.address_book_id_seq OWNED BY public.address_book.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: document_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_tag (
    document_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.document_tag OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    content text,
    document_type character varying(50),
    sender character varying(255),
    recipient character varying(255),
    document_date character varying(50),
    due_date character varying(50),
    amount double precision,
    subtotal double precision,
    tax_rate double precision,
    tax_amount double precision,
    payment_date character varying(50),
    category character varying(100),
    recurring boolean,
    frequency character varying(20),
    parent_id integer,
    original_file_name character varying(255),
    summary text,
    confidence_score double precision,
    currency character varying(10),
    status character varying(50),
    embedding public.vector(1536),
    hash character varying(64) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    entity_id integer
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(20),
    address_json text,
    vat_id character varying(50),
    iban character varying(50),
    aliases character varying[],
    created_at timestamp without time zone,
    alias character varying(100) DEFAULT 'Default'::character varying NOT NULL,
    street character varying(255),
    house_number character varying(20),
    apartment character varying(50),
    area_code character varying(20),
    county character varying(100),
    country character varying(100),
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.entities OWNER TO postgres;

--
-- Name: entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entities_id_seq OWNER TO postgres;

--
-- Name: entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entities_id_seq OWNED BY public.entities.id;


--
-- Name: llm_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.llm_config (
    id integer NOT NULL,
    provider character varying(50) DEFAULT 'local'::character varying,
    api_key character varying(255),
    api_url character varying(255),
    model_tagger character varying(100) DEFAULT 'phi3'::character varying,
    model_enricher character varying(100) DEFAULT 'llama3'::character varying,
    model_analytics character varying(100) DEFAULT 'llama3'::character varying,
    model_responder character varying(100),
    enabled boolean DEFAULT false,
    auto_tagging boolean DEFAULT true,
    auto_enrichment boolean DEFAULT true,
    external_enrichment boolean DEFAULT false,
    max_retries integer DEFAULT 3,
    retry_delay integer DEFAULT 300,
    backup_provider character varying(50),
    backup_model character varying(100),
    batch_size integer DEFAULT 5,
    concurrent_tasks integer DEFAULT 2,
    cache_responses boolean DEFAULT true,
    min_confidence_tagging double precision DEFAULT 0.7,
    min_confidence_entity double precision DEFAULT 0.8,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.llm_config OWNER TO postgres;

--
-- Name: llm_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.llm_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llm_config_id_seq OWNER TO postgres;

--
-- Name: llm_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.llm_config_id_seq OWNED BY public.llm_config.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    is_read boolean,
    created_at timestamp without time zone,
    document_id integer
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    inbox_path character varying(255) NOT NULL,
    storage_root character varying(255) NOT NULL,
    locked boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    tos_accepted_at timestamp without time zone
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: user_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_entities (
    user_id integer NOT NULL,
    entity_id integer NOT NULL,
    role character varying(20),
    is_default boolean DEFAULT false
);


ALTER TABLE public.user_entities OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    full_name character varying(100),
    role character varying(20) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    disabled boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vectors (
    id integer NOT NULL,
    doc_id integer NOT NULL,
    page integer NOT NULL,
    vector_ids text NOT NULL
);


ALTER TABLE public.vectors OWNER TO postgres;

--
-- Name: vectors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vectors_id_seq OWNER TO postgres;

--
-- Name: vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vectors_id_seq OWNED BY public.vectors.id;


--
-- Name: address_book id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.address_book ALTER COLUMN id SET DEFAULT nextval('public.address_book_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entities ALTER COLUMN id SET DEFAULT nextval('public.entities_id_seq'::regclass);


--
-- Name: llm_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llm_config ALTER COLUMN id SET DEFAULT nextval('public.llm_config_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vectors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vectors ALTER COLUMN id SET DEFAULT nextval('public.vectors_id_seq'::regclass);


--
-- Data for Name: address_book; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.address_book (id, name, entity_type, email, phone, street, address2, town, zip, county, country, group_name, last_transaction, address, vat_id, bank_details, tags, created_from, last_seen_in, created_at, updated_at) FROM stdin;
2	Kaiser Odermatt &Partner AG	company	info@kaiserodermatt.ch	+41 41 729 15 00	Baarerstrasse 12	\N	Zug	6300 Zug	\N	\N	\N	2023-03-23	\N	CHE-158-726-787	\N	\N	\N	\N	2025-05-24 22:16:18.965002	2025-05-24 22:16:18.965005
3	Visana Services AG	company	fie@visana.ch	031 357 93 00	Weltpoststrasse 19		Bern	3000 Bern 16	\N	SW	\N	2025-04-17	\N	\N	\N	\N	\N	\N	2025-05-24 22:16:51.948731	2025-05-24 22:16:58.244917
6	Helvetia Schweizerische Lebensversicherungsges. AG	company	flavia.barros@helvetia.ch	+41 58 280 86 77	Else-Zublin-Strasse 94		Winterthur	8404 Winterthur	\N	\N	\N	15.05.2025	\N	CHE-116-294-693	\N	\N	\N	\N	2025-05-25 08:14:16.560425	2025-05-25 08:14:16.560427
7	Zalando Payments GmbH	company	\N	0001-0001\n\n	Else-Ziiblin-Str. 94		Winterthur	8404 Winterthur		SW	\N	07.04.2025	\N	\N	\N	\N	\N	\N	2025-05-25 08:18:44.420687	2025-05-25 08:18:44.420689
9	Stadtwerk Winterthur	company	stadtwerk.debitoren@win.ch	+41 (0)52 267 22 22	Else-Ziiblin-Strasse 94		Winterthur	8404	\N	CH	\N	2025-04-02	\N	CHE-114-866-242	\N	\N	\N	\N	2025-05-25 08:19:10.130271	2025-05-25 08:19:10.130274
11	ABC AG, Switzerland	company	info@abc.ch	+41 44 1234567	Bahnhofstrasse	Postfach	Zurich	8001	\N	\N	\N	2023-02-14	\N	\N	\N	\N	\N	\N	2025-05-25 08:27:59.37167	2025-05-25 08:27:59.371673
12	XYZ GmbH, Industriestrasse 12, CH-8001 Zürich	company	\N	\N	\N	\N	\N	\N	\N	\N	\N	2023-02-15	\N	\N	\N	\N	\N	\N	2025-05-25 08:28:37.472391	2025-05-25 08:28:37.472394
13	ABC Gesellschaft mbH	company	\N	+41 44 1234567	Bahnhofstrasse 1	\N	Zürich	8001	\N	SW	\N	2022-02-15	\N	\N	\N	\N	\N	\N	2025-05-25 08:28:39.078857	2025-05-25 08:28:39.07886
15	Firma AG	company	info@firma.ch	+41 44 1234567	Bahnhofstrasse 12	Postfach 1234	Zürich	8001 Zürich	\N	SC	\N	2025-05-25T08:29:56.594416	\N	\N	\N	\N	\N	\N	2025-05-25 08:29:57.871422	2025-05-25 08:29:57.871425
16	LinkedIn Ireland Unlimited	company	es@validitylabs.org	1027158703\n	Wolke	Wilton Plaza, Dublin 2, Ireland	Switzerland	6331	\N	IR	\N	2025-05-25T08:30:10.668256	\N	CHE-176-436-034	\N	\N	\N	\N	2025-05-25 08:30:11.865292	2025-05-25 08:30:11.865294
17	Internet Services Inc.	company	info@isi.ch	+41 44 280 34 91\n	Technoparkstr. 1	Schellenhausstrasse 4 CH-5620 Bremgarten	Zürich	8005	\N	SW	\N	2025-05-25T08:30:22.945789	\N	CHE-103-422-088	\N	\N	\N	\N	2025-05-25 08:30:24.044313	2025-05-25 08:30:24.044314
1	Technopark Immobilien AG	company	karin.looser@technopark.ch	+41 44 445 10 11	Technoparkstrasse 1/3		Zürich	8005	\N	SW	\N	2024-02-29	\N	CHE-106-239-853	\N	\N	\N	\N	2025-05-24 21:53:57.672439	2025-05-25 08:31:06.546689
10	Swiss Bank AG	company	\N	\N	\N	\N	\N	\N	\N	\N	\N	2023-03-17	\N	\N	\N	\N	\N	\N	2025-05-25 08:27:50.156579	2025-05-25 08:31:25.919027
4	Visana Services AG	company	fie@visana.ch	031 357 93 00	Else-Ztiblin-Strasse 94, 8404 Winterthur	\N	Winterthur	8404 Winterthur	\N	SW	\N	15. Mai 2025	\N	\N	\N	\N	\N	\N	2025-05-25 08:13:34.576874	2025-05-25 08:31:34.549013
14		company	kundenservice@orellfuessli.ch	9875520019677454238990108004660\n	Industriestrasse 26	\N	Winterthur	8404	\N	\N	\N	2025-05-25T08:29:15.104614	\N	CHE-172-909-619	\N	\N	\N	\N	2025-05-25 08:29:16.597083	2025-05-25 08:31:38.991559
5	Visana Services AG	company	fie@visana.ch	19 8404 	Weltpoststrasse 19		Bern	3000 Bern 16	\N	SW	\N	15. Mai 2025	\N	\N	\N	\N	\N	\N	2025-05-25 08:13:50.909918	2025-05-25 08:31:43.171828
8	Post CH AG	company	inkasso.dfs@post.ch	+41 58 453 45 45	Wankdorfallee 4	\N	Bern	3030 Bern	\N	SW	\N	2025-05-25T08:18:57.540076	\N	CHE-116-302-542	\N	\N	\N	\N	2025-05-25 08:18:59.104184	2025-05-25 08:31:52.222813
18	Google Cloud EMEA Limited	company	\N	5166652980\n	Clanwilliam Place		Ireland	Dublin 2	\N	IR	\N	2025-05-25T08:59:29.009467	\N	CHE-426-708-309	\N	\N	\N	\N	2025-05-25 08:59:47.369167	2025-05-25 08:59:47.369169
19	{"name": "Hetzner Online GmbH", "address1": "Industriestr. 25", "address2": "", "zip": "91710 Gunzenhausen", "town": "Germany", "country": "Germany"}	company	info@hetzner.com	+49 9831 505-0\n	hetzner.com	\N	Zürich www.hetzner.com	8005	\N	\N	\N	2025-02-01	\N	CHE-482-971-449	\N	\N	\N	\N	2025-05-25 09:13:43.571186	2025-05-25 09:13:43.571188
20	Lucid Software Inc.	company	support@lucid.co	18245748\n	Else-Züblin-Str.	\N	Winterthur	8404	Zurich	SW	\N	2025-04-11	\N	CHE-417-949-825	\N	\N	\N	\N	2025-05-25 09:13:49.884562	2025-05-25 09:13:49.884564
21	Digitec Galaxus AG	company	\N	126950431\n	Pfingstweidstrasse 60b	\N	Zürich	8005	Switzerland	SW	\N	18.10.2024	\N	CHE-109-049-266	\N	\N	\N	\N	2025-05-25 09:14:14.274023	2025-05-25 09:14:14.274028
22	{"name": "DigitalOcean LLC", "address1": "105 Edgeview Drive, Suite 425", "address2": "", "zip": "80021", "town": "Broomfield", "county": "", "country": "CO, USA"}	company	andre@dat.ag	509772997\n105 	\N	\N	\N	\N	\N	\N	\N	2025-04-01	\N	CHE-357-901-451	\N	\N	\N	\N	2025-05-25 09:14:21.656407	2025-05-25 09:14:21.656409
23	{"name": "DigitalOcean LLC", "email": "andre@dat.ag"}	company	andre@dat.ag	504085758\n105 	Else-Züblin-Strasse	94	Winterthur	8404	ZH	SW	\N	2025-02-01	\N	CHE-357-901-451	\N	\N	\N	\N	2025-05-25 09:14:27.871018	2025-05-25 09:14:27.87102
24	DigitalOcean LLC ID: 134303714	company	andre@dat.ag	134303714\n105 	\N	\N	\N	\N	\N	\N	\N	2025-04-01	\N	CHE-357-901-451	\N	\N	\N	\N	2025-05-25 09:14:31.881983	2025-05-25 09:14:31.881985
25	ABC GmbH	company	info@abc.ch	+41 44 1234567	Strasse 1	Suite 101	Zürich	8000	\N	SW	\N	2025-05-25T09:15:28.523624	\N	\N	\N	\N	\N	\N	2025-05-25 09:15:28.558563	2025-05-25 09:15:28.558565
26	COING Inc.	company	billing@dat.ag	1 8557388741	2100 Geng Road	Suite 210	Palo Alto	94303	\N	UN	\N	2025-02-28	\N	\N	\N	\N	\N	\N	2025-05-25 11:00:14.811067	2025-05-25 11:00:14.811069
27	Eleven Labs Inc.	company	team@elevenlabs.io	andre@dat.ag	169 Madison Ave	#2484 Technoparkstrasse 1	New York, New York	10016	\N	UN	\N	2025-02-20	\N	CHE180-708-141	\N	\N	\N	\N	2025-05-25 11:00:25.448327	2025-05-25 11:00:31.29097
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
20250528_tenant_profile
\.


--
-- Data for Name: document_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_tag (document_id, tag_id) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, file_path, content, document_type, sender, recipient, document_date, due_date, amount, subtotal, tax_rate, tax_amount, payment_date, category, recurring, frequency, parent_id, original_file_name, summary, confidence_score, currency, status, embedding, hash, created_at, updated_at, entity_id) FROM stdin;
\.


--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entities (id, name, type, address_json, vat_id, iban, aliases, created_at, alias, street, house_number, apartment, area_code, county, country, is_active, updated_at) FROM stdin;
1	Test Company Ltd.	company	\N	TEST-VAT-456	TEST-IBAN-123	\N	\N	Test Corp	Main Street	123	\N	12345	Test City	Test Country	t	2025-05-28 14:50:34.350594
2	André Wolke	individual	\N	\N	\N	\N	2025-05-28 14:53:35.965898	Personal	Else-Züblin-Str.	94	\N	8404	Zurich/Winterthur	Switzerland	t	2025-05-28 14:57:14.298955
6	SWISSBILLING SA	company	\N		CH06 0900 0000 1518 8680 9	\N	2025-05-28 15:48:58.352027						ZURICH	CH	t	2025-05-28 15:48:58.352029
10	OpenAI, LLC	company	\N	CH VAT CHE474.735.237 IVA	\N	\N	2025-05-28 19:43:42.79206	None	548 Market Street	PMB 97273	\N	94104-5401	San Francisco	United States, Switzerland	t	2025-05-28 19:43:42.792062
13	Swisscom (Schweiz) AG	company	\N	\N	\N	\N	2025-05-28 19:44:44.333426	Swisscom (Schweiz)	Alte Tiefenaustrasse 6	\N	\N	CH-3050	Bern	Switzerland	t	2025-05-28 19:44:44.333428
14	Wolke / Candoo Labs	company	\N	\N	\N	\N	2025-05-28 19:54:21.021479	Candoo Labs	Zǎhlerweg	5	\N	6300	Zug / Zug	Switzerland	t	2025-05-28 19:54:21.021481
15	Va	company	\N	\N	\N	\N	2025-05-28 19:54:53.219257	Validity Labs	Technoparkstrasse	1	\N	8005	Zürich	Switzerland	t	2025-05-28 19:54:53.219258
16	Digital Assets Technologies AG	company	\N	\N	\N	\N	2025-05-28 19:55:27.687754	DAT AG	Technoparkstrasse	1	\N	8005	Zürich	Switzerland	f	2025-05-28 20:12:39.625283
\.


--
-- Data for Name: llm_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.llm_config (id, provider, api_key, api_url, model_tagger, model_enricher, model_analytics, model_responder, enabled, auto_tagging, auto_enrichment, external_enrichment, max_retries, retry_delay, backup_provider, backup_model, batch_size, concurrent_tasks, cache_responses, min_confidence_tagging, min_confidence_entity, created_at, updated_at) FROM stdin;
1	local	sk-ykQyqTFoUAh2xT6ovDuIjg	http://host.docker.internal:11434	phi3	llama3	llama3	\N	t	t	t	f	3	300	\N	\N	5	2	t	0.7	0.8	2025-05-25 20:47:30.204789	2025-05-25 21:26:33.641378
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, is_read, created_at, document_id) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, inbox_path, storage_root, locked, created_at, updated_at, tos_accepted_at) FROM stdin;
1	/hostfs/Inbox	/hostfs/Storage	f	2025-05-24 21:53:46.453595	2025-05-28 14:32:48.15904	2025-05-25 10:52:08.498433
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, name, created_at) FROM stdin;
1	year-2024	2025-05-24 21:53:57.628665
2	month-2024-02	2025-05-24 21:53:57.630953
3	year-2023	2025-05-24 22:16:11.425844
4	month-2023-03	2025-05-24 22:16:11.432185
11	invoice	2025-05-24 22:16:48.159085
12	insurance	2025-05-24 22:16:48.160416
13	year-2025	2025-05-24 22:16:48.161903
14	month-2025-04	2025-05-24 22:16:48.162838
17	payment_reminder	2025-05-25 08:13:19.600852
18	month-2025-05	2025-05-25 08:13:19.606018
19	payment	2025-05-25 08:13:49.021294
20	KVG	2025-05-25 08:14:05.231602
21	Mahnkosten	2025-05-25 08:14:05.233951
22	Mahnspesen	2025-05-25 08:14:15.28571
23	Immobilienbewirtschattung	2025-05-25 08:14:15.287124
25	Swiss	2025-05-25 08:27:58.249948
26	month-2023-02	2025-05-25 08:27:58.254269
29	EU invoice	2025-05-25 08:28:37.483756
30	Swiss invoice	2025-05-25 08:28:37.485815
31	year-2022	2025-05-25 08:28:37.48707
32	month-2022-02	2025-05-25 08:28:37.487801
33	google	2025-05-25 08:59:28.86072
34	Google Workspace	2025-05-25 08:59:52.144229
35	Subscription	2025-05-25 08:59:52.153154
36	month-2025-03	2025-05-25 08:59:52.169703
37	Google Cloud	2025-05-25 08:59:58.184441
40	month-2025-02	2025-05-25 09:13:42.379905
41	digitalocean	2025-05-25 09:14:26.856805
42	billing	2025-05-25 09:14:26.863327
43	Clockify Subscription - Pro	2025-05-25 11:00:00.117297
44	Monthly	2025-05-25 11:00:00.123564
\.


--
-- Data for Name: user_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_entities (user_id, entity_id, role, is_default) FROM stdin;
1	6	owner	f
1	10	owner	f
1	13	owner	f
1	15	owner	f
1	16	owner	f
1	14	owner	f
1	2	owner	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, full_name, role, hashed_password, disabled, created_at) FROM stdin;
1	admin	admin@example.com	Administrator	admin	$2b$12$6M/rxYAYbEmrZJ1vMgWVku/Jsvk3mf2noYkankjV3DYfbmWK6MOG.	f	2025-05-24 21:53:46.453595
2	viewer	viewer@example.com	View Only	viewer	$2b$12$2.ej9tJOIdIoCv/yLKf49.lyZp1FjSK6lE2dlNxISmXwLs7gtfKyy	f	2025-05-24 21:53:46.453595
\.


--
-- Data for Name: vectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vectors (id, doc_id, page, vector_ids) FROM stdin;
\.


--
-- Name: address_book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.address_book_id_seq', 27, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 108, true);


--
-- Name: entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entities_id_seq', 16, true);


--
-- Name: llm_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.llm_config_id_seq', 2, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 18, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, false);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 46, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: vectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vectors_id_seq', 1, false);


--
-- Name: address_book address_book_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.address_book
    ADD CONSTRAINT address_book_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: document_tag document_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tag
    ADD CONSTRAINT document_tag_pkey PRIMARY KEY (document_id, tag_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: llm_config llm_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llm_config
    ADD CONSTRAINT llm_config_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_entities user_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entities
    ADD CONSTRAINT user_entities_pkey PRIMARY KEY (user_id, entity_id);


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
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vectors vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vectors
    ADD CONSTRAINT vectors_pkey PRIMARY KEY (id);


--
-- Name: idx_documents_embedding; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_embedding ON public.documents USING ivfflat (embedding public.vector_cosine_ops);


--
-- Name: ix_address_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_address_book_id ON public.address_book USING btree (id);


--
-- Name: ix_documents_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_documents_entity_id ON public.documents USING btree (entity_id);


--
-- Name: ix_documents_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_documents_hash ON public.documents USING btree (hash);


--
-- Name: ix_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_documents_id ON public.documents USING btree (id);


--
-- Name: ix_entities_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_entities_id ON public.entities USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_settings_id ON public.settings USING btree (id);


--
-- Name: ix_tags_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tags_id ON public.tags USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_vectors_doc_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vectors_doc_id ON public.vectors USING btree (doc_id);


--
-- Name: ix_vectors_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vectors_id ON public.vectors USING btree (id);


--
-- Name: document_tag document_tag_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tag
    ADD CONSTRAINT document_tag_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: document_tag document_tag_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tag
    ADD CONSTRAINT document_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: documents documents_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: documents documents_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.documents(id);


--
-- Name: notifications notifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: user_entities user_entities_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entities
    ADD CONSTRAINT user_entities_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: user_entities user_entities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entities
    ADD CONSTRAINT user_entities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: vectors vectors_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vectors
    ADD CONSTRAINT vectors_doc_id_fkey FOREIGN KEY (doc_id) REFERENCES public.documents(id);


--
-- PostgreSQL database dump complete
--

