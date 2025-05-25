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
    address text,
    country character varying(2),
    vat_id character varying(50),
    bank_details text,
    tags character varying(255),
    created_from character varying(255),
    last_seen_in character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    street character varying(255),
    address2 character varying(255),
    town character varying(255),
    zip character varying(20),
    county character varying(100),
    group_name character varying(100),
    last_transaction character varying(50)
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
    hash character varying(64) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    embedding public.vector(1536)
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
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    is_active boolean,
    created_at timestamp without time zone,
    full_name character varying(100),
    role character varying(20) DEFAULT 'viewer'::character varying NOT NULL,
    disabled boolean DEFAULT false
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
-- Name: address_book id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.address_book ALTER COLUMN id SET DEFAULT nextval('public.address_book_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: address_book; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.address_book (id, name, entity_type, email, phone, address, country, vat_id, bank_details, tags, created_from, last_seen_in, created_at, updated_at, street, address2, town, zip, county, group_name, last_transaction) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
20250523_user_cols
\.


--
-- Data for Name: document_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_tag (document_id, tag_id) FROM stdin;
1	1
1	2
1	3
3	4
3	5
3	6
3	7
4	8
4	9
4	3
5	10
5	11
5	12
5	13
5	14
5	15
5	16
5	17
6	18
6	19
6	20
7	21
7	22
7	23
7	24
7	25
8	26
8	27
9	28
9	29
9	30
9	31
9	32
9	33
13	39
16	40
16	41
16	42
16	43
16	44
16	45
16	46
16	47
16	48
16	49
16	50
16	51
16	52
20	60
20	61
20	62
20	63
21	64
21	65
21	66
22	67
22	68
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, file_path, content, document_type, sender, recipient, document_date, due_date, amount, subtotal, tax_rate, tax_amount, payment_date, category, recurring, frequency, parent_id, original_file_name, summary, confidence_score, currency, status, hash, created_at, updated_at, embedding) FROM stdin;
1	Invoice r	/inbox/Invoice-3129AAF1-0016.pdf	Invoice r\n\nInvoice number 3129AAF1-0016\nDate of issue February 20, 2025\n\nDate due February 20, 2025\n\nEleven Labs Inc. Bill to\n\n169 Madison Ave Andre Wolke\n\n#2484 Technoparkstrasse 1\nNew York, New York 10016 CH-8005 Zurich\nUnited States Switzerland\nteam@elevenlabs.io andre@dat.ag\n\nEU OSS VAT EU372062016\n\nAE TRN 104205342900003\n\nAU ARN 300031695540\nNZ GST 141-784-234\n\nGB VAT GB457922166\n\nKR BRN 568-80-02689\n\nSG GST M90375979C\n\nCH VAT CHE-180.708.141 IVA\nTRTIN 3312323741\n\nSA VAT 312151778200003\nCA GST/HST 772450227RT9999\nIN GST 9924USA290350SB\n\nCA PST-BC  PST-1486-2073\nCA PST-SK 7975782\n\nCA QST 1231841217TQ1001\nVN TIN 9000001271\n\n$23.78 USD due February 20, 2025\n\nPay online\nDescription Qty Unit price Tax Amount\nCredit Usage (per credit) 94,319 $0.00\nJan 20 - Feb 20, 2025\nFirst 100000 94,319 $0.00 $0.00\nFlat fee for first 100000 0 $0.00\nCreator 1 $22.00 8.1% $22.00\n\nFeb 20 - Mar 20, 2025\n\nSubtotal $22.00\nTotal excluding tax $22.00\nVAT - Switzerland (8.1% on $22.00) $1.78\n\n3129AAF1-0016 - $23.78 USD due February 20, 2025 Page 1 of 2\n\n\n(CHF1.60)\nTotal $23.78\nAmount due $23.78 USD\n\n3129AAF1-0016 - $23.78 USD due February 20, 2025 Page 2 of 2\n	invoice	Eleven Labs Inc.	The document's recipient is not explicitly provided in the text.	February 20, 2025	February 20, 2025	23.78	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Paid	5ef33007429d521cf5542d9aafd9698f70fd73d43651b80c0248820ac4489b31	2025-05-19 20:02:36.936366	2025-05-19 20:02:36.936368	\N
2	Invoice #18245748.pdf	/inbox/Invoice #18245748.pdf	Lucid Software Inc. Invoice\n\n10355 South Jordan Gateway Suite 300 Invoice # 18245748\nSouth Jordan, UT 84095 Billed On Apr 11, 2025\nUnited States Terms On-Receipt\nEmail: support@lucid.co Due On Apr 11, 2025\n\nVAT #: CHE-417.949.825 TVA\n\nAndre Wolke\n\nElse-Ziiblin-Str. 94\nWinterthur, Zurich 8404 64 . 8 6 USD\n\nSwitzerland\nDate Description Qty Price Subtotal Tax\nApr 11 - May 11, .\n2025 Lucidchart Team 5 Monthly 1 $60.00 $60.00 8.100%\nSubtotal\nCH VAT 8.1%\nTotal\nPaid\nAmount Due\nPayments\nApr 11, 2025 $64.86 Payment from MasterCard --- 7052\nNotes\n\nAll amounts in United States Dollars (USD)\n\nTerms and Conditions:\nPLEASE NOTE THAT OUR BANKING INFORMATION HAS RECENTLY\nCHANGED\n\nPlease refer to the information below for payment processing for Lucid\nSoftware, Inc. This information is effective as of March 13, 2023\n\nPayments via ACH/wire transfer:\n\nBank Name: HSBC Bank USA, N.A.\n\nBank Address: 2911 Walden Ave, Depew, NY 14043\n\nCompany Name: Lucid Software Inc\n\nCompany Address: 10355 South Jordan Gateway, Suite 300, South Jordan,\nUtah 84095\n\nAccount Type: Checking\n\nAccount Number: 981026966\n\nACH Transfer Routing Number: 022000020\n\nWire Transfer Routing Number: 021001088\n\nTotal\n$64.86\n$60.00\n\n$4.86\n\n$64.86\n($64.86)\n\n$0.00\n\nPage 1 of 2\n\n\nSwift Code (bank code for international wires): MRMDUS33\n\nPayments by check:\n\nLucid Software Inc.\n\n10355 South Jordan Gateway, Suite 300\nSouth Jordan, Utah 84095\n\nAs a reminder, official Lucid correspondence will come from one of four\ndomains: lucid.co, lucidchart.com, lucidspark.com, or lucidscale.com\n\nIf you would like to verify any communication from Lucid regarding payment or\naccount information, you can reach out to the Lucid Accounts Receivable Team\nat ar@lucid.co or call 385-292-0856\n\nFor other assistance, please contact support@lucid.co\nPlease send remittance advice to ar@lucid.co\n\nLegal Notice: This Order Form is subject to either the electronically or manually\nsigned services agreement between the parties, Lucid's standard Terms of\nService found at https://lucid.co/tos (for direct customers and end users), or\nLucid's channel partner agreement found at https://lucid.co/channel-partner-\nagreement (for resellers and pass through payment entities), as applicable (the\n"Agreement"). Any and all terms and conditions (preprinted or otherwise and\nregardless of how referenced) found in any purchase orders, vendor registration\nforms or portals, or similar documents shall be void and of no effect. Lucid\nassumes no obligations to states or end users pursuant to any cooperative\npurchasing organization contracts to which a reseller may be a party and no\nterms and conditions from any cooperative purchasing organization contracts\nare applicable to this purchase. Additional products or subscriptions added\nduring the Subscription Term stated herein and future renewals will be subject\nto the same Agreement unless changed in writing. Descriptions of what is\nincluded in Lucid's Professional Services products and certain of Lucid’s SaaS\nproducts are available at https://lucid.co/product-service-descriptions .\n\nPage 2 of 2\n	unknown					\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	pending	b21f4e1149bf3f52f1b355262601cb100ef8b5d447202a8849d9623305172c7d	2025-05-19 20:03:01.722871	2025-05-19 20:03:01.722872	\N
3	Sales receipt / Invoice order 126950431	/inbox/Digitec_Sales receipt_126950431.pdf	Digitec Galaxus AG www.digitec.ch\n\nd d ig itec.ch Pfingstweidstrasse 60b\n\n8005 Zurich\n\nSales receipt / Invoice order 126950431\n\nOrder / Invoice date 18.10.2024 21 Impact Labs AG\n\nMerchant order number Technoparkstrasse 1\n\nCustomer number 11033068 8005 Zurich\n\nOrder number Galaxus :\n\nReference person Brian Magierski Switzerland\n\nOrder reference\n\nDue date\n\nInvoice no.\n\nVAT ID CHE-109.049.266\n\nType of delivery Collection at Zurich\n\nPayment method American E xpress\n\nDelivery address Digitec Galaxus AG, Pfingstweidstrasse 60b, CH-8005\n\nZurich\n\nInvoice message\n\nCurrency CHF\n\nDescription Article number — Dispatch Quantit VAT Price excl. Price incl. Amountexcl. Amount incl.\n\ny\n\nApple iPhone 12 (64 GB, Black, 6.10", SIM +eSIM, 14003260 10/22/2024 1 8.10% 396.85 429.00 396.85 429.00\n\n12 Mpx, 5G)\n\nIMEI: 353254361353283\n\nSerial number: NO SN\n\n24 Months Warranty (10/22/2024 - 10/22/2026)\n\nApple iPhone 15 (128 GB, Blue, 6.10", SIM +eSIM, 38606681 10/22/2024 1 8.10% 624.42 675.00 624.42 675.00\n\n48 Mpx, 5G)\n\nIMEI: 355820713051862\n\nSerial number: SF WNHW 337] H\n\n24 Months Warranty (10/22/2024 - 10/22/2026)\n\nApple iPhone 16 (128 GB, Ultramarine, 6.10", SIM + 49221146 10/22/2024 1 8.10% 785.38 849.00 785.38 849.00\n\neSIM, 48 Mpx, 5G)\n\nIMEI: 351031656569985\n\nSerial number: NO SN\n\n24 Months Warranty (10/22/2024 - 10/22/2026)\nTotal amount 1'806.65 1953.00\nTotal amount includes the following VAT:\nVAT 8.10% 146.35\nTotal of all deliveries and services CHF 1953.00\n10/18/2024 Payment made -1'953.00\nAmount due 0.00\n\nDispatch Upon receiving your product, please make sure it is correct and complete and check it for damage. Any deficiencies need to be\n\nreported within five calendar days from collection resp. delivery date via your personal customer account in the online shop.\nGeneral Our general terms and conditions apply.\nWarranty services This document serves as a warranty receipt for the service centre. Further warranty information and the address of the service\n\ncentre are available in your customer account. Please send returns to the stated address only.\n	Electronic transfer	Sales receipt	21 Impact Labs AG	18.10.2024	1953.00	1953	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Paid	97d627f67fc2b3a5244fbd75809ec2d8cb28691bfe3babe4783f3089016a5178	2025-05-19 20:03:08.854389	2025-05-19 20:03:08.85439	\N
4	WiIXcom	/inbox/Wix-Invoice_2023_1058318037.pdf	WiIXcom\n\nWix.com LTD\n40 Namal Tel Aviv, 6350671\n\nIsrael\nVAT ID : CHE-147.321.392 MWST\n\nInvoice #1058318037 May 31,2023 _ Paid\n\nIssued to:\n\nAndre Wolke\nTechnoparkstrasse 1 Zurich\nZurich Switzerland\n\nDigital Assets Technologies AG\n\nDescription Site Billing Period Quantity Amount\nPremium plan Financial Audit And 2 Year 1 €528.00\nBusiness Unlimited May 31, 2023 - May 31, 2025\nPayment Method: Mastercard ¢+«-1285 Coupon discount -€264.00\nSubtotal €264.00\nVAT (7.7%) €20.32\nTotal €284.32\n\n* Any deductions listed above apply to the current invoice only.\n\nFeel free to contact us: fF wix.com/support & 1-415-639-9034\n\nMY wix.com/contact\n	invoice	Andre Wolke	Zurich Switzerland	2023-05-31		284.32	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Paid	53866a2892b002bd993520b6b5535641b197e0d1afb20fb62facd8f2ebb0198f	2025-05-19 20:03:17.19757	2025-05-19 20:03:17.197572	\N
6	Google	/inbox/Google_5224619189.pdf	Google\n\nInvoice\n\nInvoice number: 5224619189\n\nBill to\nAndré Wolke\nDigital Assets Technology AG\n\nTechnoparkstrasse 1\n\n8005 Zurich\n\nSwitzerland\n\nDetails\n\nInvoice number ...................... 5224619189\n\nInvoice date ....................2..... Mar 31, 2025\n\nBilling ID .............0. eee 1983-6892-8258\nAccount ID ..................00.0ee ee 01E854-E64B20-133EDB\n\nYou will be automatically charged for any amount due.\n\nGoogle Cloud EMEA Limited\nVelasco\n\nClanwilliam Place\n\nDublin 2\n\nIreland\n\nVAT number: CHE-426.708.309\n\nGoogle Cloud\n\nTotal in CHF CHF 1,022.65\n\nSummary for Mar 1, 2025 - Mar 31, 2025\n\nSubtotal in CHF CHF 946.02\nVAT (8.1%) CHF 76.63\nTotal in CHF CHF 1,022.65\n\nPage 1 of 2\n\n\nGoogle” Invoice Invoice number: 5224619189\n\nUse the Google Cloud Platform cost table to view and download detailed invoice data such as per-project costs:\n\nDescription\n\nGoogle Cloud - Fee for March 2025\n\nSubtotal in CHF\nVAT (8.1%)\n\nTotal in CHF\n\nAmount(CHF)\n\n946.02\n\nCHF 946.02\nCHF 76.63\n\nCHF 1,022.65\n\nPage 2 of 2\n	Invoice	Google Cloud	Google	2025-03-31		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Paid	83f6492075efa5c75d3ccbde152dbf02e545cd5f0daa57082fad7fc70d5f73e9	2025-05-19 20:03:35.82651	2025-05-19 20:03:35.826512	\N
7	DigitalOcean	/inbox/DigitalOcean Invoice 2025 Mar.pdf	4) DigitalOcean\n\nFinal invoice for the March 2025 billing period\n\nFrom Invoice Details\n\nDigitalOcean LLC\n\n105 Edgeview Drive, Suite 425\nBroomfield, CO, 80021\n\nVAT ID: CHE-357.901.451 MWST\n\nBilling Details\n\nTeam Blockonauts\n<andre@dat.ag>\nElse-Zublin-Strasse 94\nWinterthur, ZH, 8404\nSWITZERLAND\n\nSummary\n\nTotal usage charges\n\nInvoice number:\nDate of issue:\nPayment due on:\n\nTeam ID\n\ndo:team:a9d0abb1-1ba5-4b88-af01-0f938050a157\n\n509772997\n\nApril 1, 2025\nApril 1, 2025\n\nSubtotal\n\nVAT Switzerland (8.10%)\n\nTotal due\n\nProduct Usage Charges\n\nDetailed usage information is available via the API or can be downloaded from the billing section of your account\n\nDroplets\n\npassbolt-p01 (s-1lvcpu-2gb)\nerp-p01 (s-2vcpu-4gb)\n\nnfty-alerts (Ss-lvcpu-512mb-10gb)\ndat-stargate-01 (s-lvcpu-1gb)\nassets-dat-01 (s-lvcpu-1gb)\n\naccounting-p-dat-01 (s-2vcpu-4gb)\n\nDroplet Snapshots\n\npassbolt-p01-1707755441748 (fra1) 10.15GB Droplet Snapshot\n\nHours\n\n744\n\n744\n\n744\n\n744\n\n744\n\n744\n\nHours\n\n744\n\nStart\n\n03-01 00:00\n\n03-01 00:00\n\n03-01 00:00\n\n03-01 00:00\n\n03-01 00:00\n\n03-01 00:00\n\nStart\n\n03-01 00:00\n\nEnd\n\n04-01 00:00\n\n04-01 00:00\n\n04-01 00:00\n\n04-01 00:00\n\n04-01 00:00\n\n04-01 00:00\n\nEnd\n\n04-01 00:00\n\n$76.00\n$12.00\n$24.00\n$4.00\n$6.00\n$6.00\n\n$24.00\n\n$0.61\n\n$0.61\n\nPage 1 of 2\n\n\nDroplet Backups Hours Start End $2.40\n\npassbolt-p01 (Weekly Backup Services) 5 03-03 12:06 03-31 12:08 $2.40\n\nPage 2 of 2\n	invoice	Team Blockonauts	Winterthur, ZH, 8404 SWITZERLAND	March 2025	April 1, 2025	76	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Paid	9a8874f9242dd84599b8dcd7d4de7c0ffabbb114626cc08d588f997c9f14883d	2025-05-19 20:03:43.294424	2025-05-19 20:03:43.294425	\N
8	Invoice	/inbox/Invoice-05EA1062-0039.pdf	Invoice\n\nInvoice number O5EA1062-0039\nDate of issue March 30, 2025\nDate due March 30, 2025\n\nCOING Inc.\n\n2100 Geng Road\n\nSuite 210\n\nPalo Alto, California 94303\nUnited States\n\n+1 855-738-8741\nsupport@clockify.me\n\n$29.97 USD due March 30, 2025\n\nPay online\n\nDescription\n\nClockify Subscription - Pro (Monthly)\n\nMar 30 - Apr 30, 2025\n\nPay annually and get 20% off!\n\n05EA1062-0039 - $29.97 USD due March 30, 2025\n\nBill to\nDigital Assets Technologies AG\nbilling@dat.ag\n\nSubtotal\nTotal\nAmount due\n\nShip to\n\nG\n\nDigital Assets Technologies AG\n\nUnit price\nQty (excl. tax)\n3 $9.99\n\nAmount\n(excl. tax)\n\n$29.97\n\n$29.97\n$29.97\n$29.97 USD\n\nPage 1 of 1\n	invoice	COING Inc.		2025-03-30	2025-03-30	29.97	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Paid	4a6c66554582b3686669d1a8558ebc67cd60354305fb49006105cec90d392aed	2025-05-19 20:03:50.265894	2025-05-19 20:03:50.265895	\N
9	e12b63b9-a7af-4679-87a6-6b3d0fe8ce51.pdf	/inbox/e12b63b9-a7af-4679-87a6-6b3d0fe8ce51.pdf	STADTWCRK\n\nStadtwerk Winterthur\nKundendienst\n\nCH- 8403 Winterthur\n\nTelefon +41 (0)52 267 22 22\nstadtwerk.kundendienst@win.ch\nstadtwerk.winterthur.ch\n\nUID CHE- 114.866.242 MWST\n\nFrau und Herr\n\nRechnung 8103995618 Kundennummer 1149117 Caroline und André Wolke\n\nVertragskonto 2259165 Else-Zublin-Strasse 94\n\nRechnungsdatum 16.11.2023 8404 Winterthur\n\nZahlbar bis 18.12.2023\n\nZahlungsart E-Rechnung\n\nIdentifikation 41100000196483437\n\nRechnung vom 08.08.2023 bis 08.11.2023 Seite 1/4\n\nVerbrauchsstelle: 5100299, Else-Zublin-Strasse 94, 8404 Winterthur, OG 1 Whg 04 0101\nEigentumer: Helvetia Schweizerische Lebensversicheru, Gesellschaft AG, St. Alban-Anlage 26, CH-4052 Basel\n\nBezeichnung Betrag in CHF MwsSt. MwSt. | Betrag in CHF\n\nexkl. MwSt. in% in CHF inkl. MwSt.\nStrom: Energieverbrauch und Netznutzung 321.70 7.70 24.77 346.47\nAbfall 18.57 7.70 1.43 20.00\nSummen 340.27 26.20 366.47\nRundungsdifferenz -0.02\nZahlungsbetrag 366.45\n\nBitte beachten Sie die Rechnungsruckseite fur wichtige Hinweise. Stadt Winterthur WAN,\n<4 pee ee eee nen nn en eee en ee ee ee ee ee ee ee eee eee eee ee eee eee eee eee eee eee\nEmpfangsschein Zahliteil Konto / Zahlibar an\n\nCH94 3000 0002 8400 0095 1\nStadtwerk Winterthur\n8403 Winterthur\n\nReferenz\n\n00 00000 00001 14911 72116 24814\n\nKonto / Zahlbar an\n\nCH94 3000 0002 8400 0095 1\nStadtwerk Winterthur\n\n8403 Winterthur\n\nReferenz\n\n00 00000 00001 14911 72116 24814\n\nZahlbar durch\n\nCaroline und André Wolke\nElse-Zublin-Strasse 94\n8404 Winterthur\n\nZahlbar durch\n\nCaroline und André Wolke\nElse-Zublin-Strasse 94\n8404 Winterthur\n\nWahrung Betrag\nCHF 366.45\n\nWahrung Betrag\nCHF 366.45\n\nAnnahmestelle\n\n\nWICHTIGE HINWEISE\n\nHaben Sie Fragen?\n\nTarifzeiten\n\nStorungsdienst\n\nUnsere\nBankverbindung\n\nLastschrift-\nverfahren\n\nE-Mail-Rechnung\n\nE-Rechnung (eBill)\n\nWohnungs- oder\nGeschafts|lokal-\nwechsel\n\nErreichbarkeit Kundendienst Mo-Do 8.00 -17.00 Uhr Stadtwerk Winterthur\nTel. 052 267 22 22 Fr 8.00 - 16.00 Uhr Untere Schontalstrasse 12\nstadtwerk.kundendienst@win.ch 8406 Winterthur\n\nNormaltarif Mo-Fr 7.00 -20.00 Uhr\nNiedertarif alle Ubrigen Zeiten\n\n(Feiertage gelten als normale Tariftage)\n24 Stunden fir Sie da!\n\nBei Stérungen erreichen Sie uns unter der Telefonnummer 0800 84 00 84\n\nBank Credit Suisse, CH-8401 Winterthur\nIBAN CH74 0483 5048 5350 6100 7\nSWIFT-/BIC-Code CRESCHZZ84R\n\nWenn Sie per Lastschriftverfahren zahlen, erfolgt die Belastung Ihres Kontos am Falligkeitstag.\n\nBestellen Sie Ihre Energierechnung in Ihr E-Mail- Postfach. So konnen Sie die Rechnung online\nkontrollieren, ablegen oder nach Wunsch weiterleiten. Zudem sparen Sie Papier.\nWeitere Informationen unter stadtwerk.winterthur.ch/rechnung.\n\nNutzen Sie eBill, um Ihre Zahlung per E- Banking vorzunehmen.\nWeitere Informationen unter stadtwerk.winterthur.ch/rechnung.\n\nDamit Sie bei einem Wohnungs- oder Geschaftslokalwechsel nur die von Ihnen bis zum Umzug bezogene\nEnergie verrechnet bekommen, ist eine Zwischenablesung des Zahlerstandes notig. Bitte melden\n\nSie sich dafur mindestens 10 Tage vor dem Umzugstermin. Bei fehlender Zwischenablesung mussen wir\nIhnen die gesamte bis zur nachsten Ablesung bezogene Energie verrechnen.\n\n\n\nSTADTWCRK\n\nInformationen zur Verbrauchsperiode vom 08.08.2023 bis 08.11.2023 Kundennummer 1149117\nVertragskonto 2259165\n\nRechnung 8103995618\n\nRechnungsdatum 16.11.2023\n\nSeite 3/4\n\nVerbrauchsstelle: 5100299, Else-Zublin-Strasse 94, 8404 Winterthur, OG 1 Whg 04 0101\nEigentumer: Helvetia Schweizerische Lebensversicheru, Gesellschaft AG, St. Alban-Anlage 26, CH-4052 Basel\n\nDetails zur Rechnung\n\nBezeichnung tap Preis Nettobetrag\nCHF CHF\n\nStrom\nEnergieverbrauch, Basic (1)\n‘KlimaSilberHochtarif = «458 kWh 0.1439 ~~ 65.91 —\nKlimaS ilber Niedertarif 696 kWh 0.1289 89.71\n‘Netznutzung, Basic (1)(3) eee\n‘Arbeitspreis Hochtarf = = 458 kWh 0.1190 5450.\nArbeitspreis Niedertarif 696 kWh 0.0700 48.72\nGrundpreis 3 Mt 9.80 29.40\nAbgaben an das Gemeinwesen (2)\n‘Férderprogramm Energie Winterthur = 1154 #kWh 0.0060 } }# 6.92.\n‘Bundesabgaben (2) ss—<‘“‘—s~s~—‘“‘“<CO\n“Netzzuschlag (u.a. furEinspeisevergutung = 1154 &x4kWh 0.0230 26.54 —\nKEV und Einmalvergttung)\nMwSt. 7.7% 24.77 Brutto 346.47 321.70\nAbfall (Verrechnung fur Departement Bau und Mobilitat)\nAbfallgrundgebuhr Mehrfamilienhaus 3 Mt 6.19 18.57\nMwSt. 7.7% 1.43 Brutto 20.00 18.57\nTotal ohne MwSt. 340.27\nTotal MwSt. 26.20\nTotalink.MwSt  ©°}.}}© 00000 ~366.47 —\n\n(1) In unserem Kundenportal (stadtwerk.winterthur.ch/kundenportal) haben Sie die Mdglichkeit, Ihre Stromverbrauchsdaten\neinzusehen.\n(2) Berechnungsgrundlage: Energieverbrauch in kWh\n\n(3) ab 1.1.2023: inkl. Systemdienstleistungen von Swissgrid AG (0,46 Rp./kWh)\n\nDetails zum Verbrauch\n\nZahler Messpunkt Einh. Verbrauch\nStrom Hochtarif 2113316 CH1018601234500000000000000100237 kWh 458.000\n\nStrom Niedertarif 696.000\n\nKlimafonds Stadtwerk Winterthur\n\nUnterstutzen Sie den Klimafonds Stadtwerk Winterthur mit einem Aufpreis von 2 Rappen pro bezogener Kilowattstunde Strom.\nWeitere Informationen finden Sie unter stadtwerk.winterthur.ch/klimafonds\n\nStadt Winterthur NEN,\n\n\nSTADTWCRK\n\nInformationen zur Verbrauchsperiode vom 08.08.2023 bis 08.11.2023 Kundennummer 1149117\nVertragskonto 2259165\n\nRechnung 8103995618\n\nRechnungsdatum 16.11.2023\n\nSeite 4/4\n\nCO.,-Fussabdruck lhres Stromverbrauchs\n\nAuch erneuerbarer Strom verursacht CO,-Emissionen. Diese Angaben zeigen den Fussabdruck Ihres Stromverbrauches in Gramm\nCO, (g CO,-eq). Mehr zu den Stromprodukten, die die Energie- und Klimaziele Winterthurs unterstutzen, auf stadtwerk.winterthur.ch/\nstrom\n\n| = Menge si CO,-Fussabdruck CO,-Emissionen\nStromverbrauch 6.90 g CO,-eq/kWh 7'962.60 g CO,-eq\n\nVerbrauchsvergleich\nVorjahresperiode | Aktuelle Periode Abweichung in%\n\nStrom Hochtarif 492 kWh 458 kWh -6.91\nStrom Niedertarif 696 kWh 122 kWh 21.25\n\nStadt Winterthur NEN,\n	invoice	Stadtwerk.kundendienst		16.11.2023	18.12.2023	366.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	pending	c98a1ba0ace493a1f9f269b661719b4ee5f0f59320030181ec4c57c80a72dab1	2025-05-19 20:04:04.155202	2025-05-19 20:04:04.155204	\N
12	DigitalOcean	/inbox/Digital_Ocean_05.pdf	4) DigitalOcean\n\nPayment Receipt\n\nFrom\n\nDigitalOcean LLC\n\n105 Edgeview Drive, Suite 425\nBroomfield, CO, 80021\n\nVAT ID: CHE-357.901.451 MWST\n\nFor\n\nTeam Blockonauts\n<andre@dat.ag>\nElse-Zublin-Strasse 94\nWinterthur, ZH, 8404\nSWITZERLAND\n\nPayment (mastercard 1285):\n\nDetails\n\nID:\n\nPayment date:\n\n134303714\nApril 1, 2025\n\n-$85.41\n\nPage 1 of 1\n	Invoice	Andre@dat.ag	Else-Zublin-Strasse 94	2025-04-01		-85.41	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	paid	8704d6b7fa77158a03a50193c28771f70de16dfd4c87fbddcc519d940992db81	2025-05-19 20:04:34.978541	2025-05-19 20:04:34.978546	\N
11	B250101052	/inbox/ISI_B250101052.pdf	Absender: Internet Services Inc., Schellenhausstr. 4, CH-5620 Bremgarten\n\nDigital Assets Technologies AG\nTechnoparkstr. 1\n\n8005 Zurich\n\nSwitzerland\n\nRECHNUNG NR. B250101052\n\nHiermit stellen wir Ihnen folgendes in Rechnung:\n\nPos. Artikel\n\n1\n\nInternet | 1G economy. | Zeitraum: 01.01.2025 - 30.06.2025\n\nRechnungsbetrag exkl. MwSt:\nMwSt 8.1% (CHE-103.422.088 MWST):\nRechnungsbetrag inkl. MwSt:\n\nKonditionen:\n\nReklamationen innert 10 Tagen.\nZahlbar innert 30 Tagen netto.\nFinanztransaktions-Gebuhren zu Lasten Kunde.\n\nBesten Dank fur Ihren Auftrag.\n\nEmpfangsschein\n\nKonto / Zahibar an\n\nCH10 0900 0000 8001 6140 5\nInternet Services Inc.\nSchellenhausstrasse 4\nCH-5620 Bremgarten\n\nReferenz\n\nRF19B250101052\n\nZahlbar durch\n\nDigital Assets Technologies AG\nTechnoparkstr. 1\n\nCH-8005 Zurich\n\nWahrung Betrag\nCHF 768.00\n\nAnnahmestelle\n\nWahrung\nCHF\n\nBetrag\n768.00\n\n[SLCH\n\nINTERNET SERVICES INC.\n\nSchellenhausstr. 4\nCH-5620 Bremgarten\n\ninfo@isi.ch\n+41 44 280 3491\n\n6.00 Mt.\n\n1. Januar 2025\n\nMenge Preis\n\n118.41 CHF\n\n710.45 CHF\n\n768.00 CHF\n\nKonto / Zahlbar an\n\nCH10 0900 0000 8001 6140 5\nInternet Services Inc.\nSchellenhausstrasse 4\nCH-5620 Bremgarten\n\nReferenz\n\nRF19B250101052\n\nZusatzliche Informationen\n\nB250101052\n\nZahlbar durch\n\nDigital Assets Technologies AG\nTechnoparkstr. 1\n\nCH-8005 Zurich\n\n710.45 CHF\n	invoice	ISI.CH AG				780	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	CHF	paid	c248bd795b2184e656fbf1fc1d18f35d54c226010b197cb6c3c40deb442b33f2	2025-05-19 20:04:30.096429	2025-05-19 21:16:06.886556	\N
16	3129AAF1-0018	/inbox/Invoice-3129AAF1-0018.pdf	Invoice r\n\nInvoice number 3129AAF1-0018\nDate of issue April 20, 2025\n\nDate due April 20, 2025\n\nEleven Labs Inc. Bill to\n\n169 Madison Ave Andre Wolke\n\n#2484 Technoparkstrasse 1\nNew York, New York 10016 CH-8005 Zurich\nUnited States Switzerland\nteam@elevenlabs.io andre@dat.ag\n\nEU OSS VAT EU372062016\n\nAE TRN 104205342900003\n\nAU ARN 300031695540\nNZ GST 141-784-234\n\nGB VAT GB457922166\n\nKR BRN 568-80-02689\n\nSG GST M90375979C\n\nCH VAT CHE-180.708.141 IVA\nTRTIN 3312323741\n\nSA VAT 312151778200003\nCA GST/HST 772450227RT9999\nIN GST 9924USA290350SB\n\nCA PST-BC  PST-1486-2073\nCA PST-SK 7975782\nCA QST 1231841217TQ1001\n\nVN TIN 9000001271\nNO VAT 833914332MVA\nJP TRN T5700150129266\n\n$23.78 USD due April 20, 2025\n\nPay online\nDescription Qty Unit price Tax Amount\nCredit Usage (per credit) 0 $0.00\nMar 20 — Apr 20, 2025\nFirst 100000 0 $0.00 $0.00\nFlat fee for first 100000 0 $0.00\nCreator 1 $22.00 8.1% $22.00\n\nApr 20 - May 20, 2025\n\nSubtotal $22.00\n\n3129AAF1-0018 - $23.78 USD due April 20, 2025 Page 1 of 2\n\n\nTotal excluding tax $22.00\nVAT - Switzerland (8.1% on $22.00) $1.78\n\n(CHF1.45)\nTotal $23.78\nAmount due $23.78 USD\n\n3129AAF1-0018 - $23.78 USD due April 20, 2025 Page 2 of 2\n	Invoice	Eleven Labs Inc.	The document is addressed to Eleven Labs Inc.	April 20, 2025		23.78	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	paid	c6240f956fe29af9adbfa75182a2d4a3e4f0284155ed2cff54169b3d0df656c2	2025-05-19 20:05:25.669176	2025-05-19 20:05:25.669177	\N
13	Google	/inbox/Google_3.pdf	Google\n\nInvoice\n\nInvoice number: 5175622765\n\nBill to\nAndré Wolke\nDigital Assets Technology AG\n\nTechnoparkstrasse 1\n\n8005 Zurich\n\nSwitzerland\n\nDetails\n\nInvoice number ...................... 5175622765\n\nInvoice date ....................2..... Jan 31, 2025\n\nBilling ID .............0. eee 1983-6892-8258\nAccount ID ..................00.0ee ee 01E854-E64B20-133EDB\n\nYou will be automatically charged for any amount due.\n\nGoogle Cloud EMEA Limited\nVelasco\n\nClanwilliam Place\n\nDublin 2\n\nIreland\n\nVAT number: CHE-426.708.309\n\nGoogle Cloud\n\nTotal in CHF CHF 980.69\n\nSummary for Jan 1, 2025 - Jan 31, 2025\n\nSubtotal in CHF CHF 907.21\nVAT (8.1%) CHF 73.48\nTotal in CHF CHF 980.69\n\nPage 1 of 2\n\n\nGoogle” Invoice Invoice number: 5175622765\n\nUse the Google Cloud Platform cost table to view and download detailed invoice data such as per-project costs:\n\nDescription\n\nGoogle Cloud - Fee for January 2025\n\nSubtotal in CHF\nVAT (8.1%)\n\nTotal in CHF\n\nAmount(CHF)\n\n907.21\n\nCHF 907.21\nCHF 73.48\n\nCHF 980.69\n\nPage 2 of 2\n	Invoice	Digital Assets Technology AG	Thomas Wolke	2..... Jan 31, 2025		980	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Unspecified	93ef7ba3bd48a40e597412ddf21fce88172ec9b81ab4c9e06b00e6c160fac99b	2025-05-19 20:04:41.658981	2025-05-19 20:46:06.240867	\N
14	5212350758	/inbox/Google_2.pdf	Google\n\nInvoice\n\nInvoice number: 5212350758\n\nBill to\n\nAndré Wolke\n\nDAT AG\nTechnoparkstrasse 1\n8005 Ziirich\nSwitzerland\n\nDetails\n\nInvoice number ...................... 5212350758\nInvoice date ....................2..... Mar 31, 2025\nBilling ID .............0. eee 4003-2561-6806\n\nDomain name ........................ dat.ag\n\nYou will be automatically charged for any amount due.\n\nGoogle Cloud EMEA Limited\n\nVelasco\nClanwilliam Place\nDublin 2\n\nIreland\n\nVAT number: CHE-426.708.309\n\nGoogle Workspace\n\nTotal in EUR\n\nSummary for Mar 1, 2025 - Mar 31, 2025\n\nSubtotal in EUR\nVAT (8.1%)\nTotal in EUR\n\nFor reference in CHF:\nSubtotal in CHF\n\nVAT (8.1%)\n\nTotal in CHF\n\nExchange rate EUR 1 : CHF 0.9389659\n\n€134.26\n\n€124.20\n€10.06\n€134.26\n\nCHF 116.62\nCHF 9.45\nCHF 126.07\n\nPage 1 of 2\n\n\nGoogle” Invoice\n\nSubscription\n\nDescription Interval\n\nUsage Mar 1 - Mar 31\n\nInvoice number: 5212350758\n\nQuantity\n\n9\n\nAmount(€)\n\n124.20\n\nGoogle Workspace Business Standard\n\nSubtotal in EUR\nVAT (8.1%)\n\nTotal in EUR\n\n€124.20\n€10.06\n\n€134.26\n\nPage 2 of 2\n	unknown	Google Cloud EMEA Limited				134.26	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	EUR	paid	f383fc58def5327064fdb8b5fe65efb31d33d9ed54717ff614c9c60030095199	2025-05-19 20:04:54.935862	2025-05-19 21:14:47.203171	\N
17	2025-03-181757	/inbox/absence-invoice-2025-03.pdf	Digital Assets Technologies AG\nAndré Wolke\n\nTechnoparkstrasse 1\n\nCH-8005 Zurich\n\nInvoice Number: 2025-03-181757\nCustomer ID: 159315\n\nDate of Invoice 21.03.2025\n\nProduct Quantity\nAbsence Management 3\nPersonnel File 3\n\nTotal Amount Due\n\nabsence®\n\nabsence.io GmbH\nLandshuter Allee 49\n\n80637 Munchen\n\nPhone: +49 89 143777477\nEmail: invoicing@absence.io\n\nPeriod Amount Total\n2025-03-21 - 2025-04-21 €2.00 €6.00\n2025-03-21 - 2025-04-21 €2.00 €6.00\n\n€12.00\n\nThe invoice amount is payable 14 days after the invoice date. Please include the invoice\nnumber when making the transfer. Thank you for choosing absence. io!\n\nReverse Charge: Please note that the tax liability lies with the recipient of the rendered\n\nservices (Section 13b (2) No. 7 and 8 of the German VAT Act)\n\nBest regards,\nYour absence.io team\n\nKirill Mankovski, Christian Heuermann\n(Managing Director)\n\nRegistered at Amtsgericht Miinchen\nRegister No. HRB 211629\n\nLandshuter Allee 49\n80637 Munchen\nPhone: +49 89 143777477\n\nEmail: invoicing@absence.io\n\nTax ID: 143/110/40 678\nVAT ID: DE294808323\nIBAN:\nDE80701500001005676299\nBIC: SSIKRMDEMMXxx\n	invoice	absense.io GmbH				12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	EUR	paid	ee0daa3cba7445e6e54f436d55f50a4dc2c4223e740bcdcc20414bcba10069f4	2025-05-19 20:05:32.757661	2025-05-19 21:13:30.767694	\N
15	14052025	/inbox/14052025_Helvetia ^.pdf	helvetiaA\n\nImmobilien\neinfach. klar. helvetia. Helvetia Schweizerische Lebensversicherungsges. AG\nIhre Schweizer Versicherung\ntmmobilienbewirtschaftung Zirich\nCH-4002 Base! Post CH AG sri\nUneingeschrieben Zurichstrasse 130\nUO ATA Times ee00Dibenced\n1.903153.090455 4002 Basel IBW ZH T +41 58 280 86.77\n. Flavia Barros, +41 58 280 86 97\nHer Wolke ri pe flavia.barros@helvetia.ch\nElse-Ziblin-Strasse 94 he\n8404 Winterthur\ntm Namen und Auftrag der Immobilieneigentimerin\nHelvetia Schweizerische Lebensversicherungsges. AG\nSt. Alban-Anlage 26\n4002 Base!\nMWST-Nr. CHE-116.294.693 MWST\n15.05.2025\n\nKiindigungsandrohung\n\nSehr geehrter Herr Wolke\nBei der Durchsicht unserer Buchhaltung haben wir festgestellt, dass der unten aufgefihrte Zahlungsbetrag bei uns\nnicht eingegangen ist. Wir fordern Sie deshalb auf, diesen Ausstand sofort zu begleichen.\n\nFalls die ausstehende Miete nicht innerhalb von 30 Tagen seit Empfang dieser Mahnung bezahlt ist, werden wir -\ndas Mietverhaltnis gemass OR 257d kindigen.\n\nUnabhangig davon werden wir nach Ablauf von 10 Tagen das Betreibungsverfahren einleiten, sofern bis dahin der\nfallige Betrag nicht Gberwiesen wurde.\n\nSollte sich diese Mahnung mit Ihrer Zahlung gekreuzt haben, so bitten wir Sie um Entschuldigung (Zahlungen\nberticksichtigt bis 14.05.2025).\n\nFreundliche Griisse\n\nHelvetia Schweizerische Lebensversicherungsges. AG\nImmobilienbewirtschaftung Ztrich\n\nSax\n\nFlavia Barros Carlo Amato\n\nJunior-Bewirtschafterin Sachbearbeiter\n\nLiegenschaft: Else-Ziblin-Strasse 94, 8404 Winterthur\n\nReferenz Typ Fallig am Forderung Ihre Zahlung Saldo CHF\n7846.04.0101.05 Bruitomietzins 01.01.2025 2'700.00 -2'680.00 20.00\n7846.04.0101.05 Bruttomietzins 01.03.2025 2'700.00 -2'680.00 20.00\n7846.04.0101.05 Bruittomietzins 01.04.2025 2'700.00 -2'680.00 20.00\n7846.04.0101.05 Bruttomietzins 01.05.2025 2'700.00 -2'680.00 20.00\n\n112\n\n\nhelvetia A\n\nImmobilien\nLiegenschaft:\nReferenz Typ Fallig am Forderung Ihre Zahlung Saldo CHF\nMahnspesen 15.05.2025 30.00 0.00 30.00\nTotal zu unseren Gunsten (Zahlungsbetrag) CHF 110.00\n\n212\n\nVor der Einzahlung abzutrennen\n\nEmpfangsschein Zahiteil Konto / Zahibar an <\nonto /Zahib CH86 3000 0003 4000 0081 6 g\nonto eran Helvetia Schweizerische Lebensversicherungsges. AG =\nCH86 3000 0003 4000 0081 6 2\nHelvetia Schweizerische St. Alban-Anlage 26 °\nLebensversicherungsges. AG 4002 Basel\nSt. Alban-Anlage 26\n4002 Basel Referenz\nReterenz 55 50200 00000 01001 00409 81180\n55 50200 00000 01001 00409 81180 Zahibar durch\nar dure\npene Walk André Wolke\nnore tyoike Else-Zublin-Strasse 94\nElse-Ziiblin-Strasse 94 ;\n8404 Winterthur 8404 Winterthur\nWéhrung — Betrag Wahrung Betrag\nCHF 110.00 CHF 110.00\n\nAnnahmestelfle\n	invoice	Helvetia Versicherungen		2025-05-20	2025-05-30	120	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	CHF	paid	cf3926e5830ea0d46fa3215b2b93d03bbed211766feceda040d8e9065f98f3b1	2025-05-19 20:05:14.750453	2025-05-19 20:56:21.040522	\N
5	8755200196 	/inbox/Orellfuessli_2025-02-19.pdf	9875520019677454238990108004660 Orell Fiissli Thalia AG\nIndustriestrasse 26\n\n8404 Winterthur\n\nrT | |\nTel: 0848 849 848\nFax: 044 455 56 20\nB2C: kundenservice@ orellfuessli.ch\nB2B: geschaeftskunden@ orellfuessli.ch\n\nLo. ; ; ; Rechnungsnummer: 8755200196\nOrell Fussli Thalia AG _Industriestrasse 26 8404 Winterthur\nRechnungsdatum: 18.02.2025\nHerm Kund : 7745423899\nAndre Wolke undennummer:\nElse-Zublin-Strasse 94 Auftragsnummer: 1382249918\n8404 Winterthur Postsendungsnummer: § 440010400100760600\nBitte bei Zahlung oder Ruckfragen angeben:\nVerwendungszweck: 8755200196-7745423899\nRechnung Seite 1 von 2\nLiefer- und Leistungsdatum gleich Rechnungsdatum, soweit nicht anders angegeben.\nZahlungsfrist bei Rechnung und Vorkasse: 15 Tage.\nMenge Bezeichnung Netto Brutto MwSt\n4251192143587\n1 ST 448 Leos Tag - Windel, Topfchen, Klo - das geht so! 17.48 18.90 CHF 81%\n9783570181881\n1 ST BLUEY - Spiel und Spa - Ein Malbuch 9.65 9.90 CHF 26%\n9783849947743\n1 ST Schwager & Steinlein: Bluey Mein Malblock 7.10 7.90 CHF 2.6%\n9781405292528\n1 ST Hargreaves, Roger: Little Miss: Pocket Library 9.65 9.90 CHF 26%\n\nwww.orellfuessli.ch CHE-172.909.619 MWST IBAN: CH72 0900 0000 8400 8704 1\n\nH Konto / Zahlbar an\nZahitell CH23 3000 0001 8400 8704 1\nOrell Fuessli Thalia AG\nDietzingerstrasse 3\n8036 Zuerich\n\nEmpfangsschein\n\nKonto / Zahlbar an\n\nCH23 3000 0001 8400 8704 1\nOrell Fuessli Thalia AG\nDietzingerstrasse 3\n\n8036 Zuerich\n\nReferenz\n\n42 26390 00000 00008 75520 01960\n\nReferenz\n\n42 26390 00000 00008 75520 01960\n\nZahlbar durch\n\nAndre Wolke\nElse-Zueblin-Strasse 94\n8404 Winterthur\n\nZahlbar durch\n\nWahrung —_Betrag Wahrung Betrag Andre Wolke\nCHF 46.60 CHF 46.60 Else-Zueblin-Strasse 94\ny 8404 Winterthur\n\nAnnahmestelle\n\n\nSeite 2 von 2\n\nRechnungsnummer: 8755200196\nRechnungsdatum: 18.02.2025\n\nLt |\nKundennummer: 7745423899\nore USS Auftragsnummer: 1382249918\n\nUbertrag 46.60 CHF\nSteuersatz Steuerl. Entgelt Warenwert Summe Netto: 44.48 CHF\n2.6 % 0.70 CHF 27.00 CHF Summe MwsSt: 2.12 CHF\n81 % 1.42 CHF 17.48 CHE Endbetrag: 46.60 CHF\nSumme 2.12 CHF 44.48 CHF\nDie von Ihnen gewahlte Zahlungsart: Uberweisung\nDie Lieferung erfolgt versandkostenfrei.\nSumme Exemplare berechnet: 4\nOrell Fussli Thalia AG Industriestrasse 26 Tel. +41 (0) 848 849 848 CHE-172.909.619 MWST Postfinance\nB2C: CH-8404 Winterthur Fax +41 (0) 44 455 56 20 ZAZ-Konto: 4989-4 Konto: 84-8704-1\nkundenservice@ orellfuessli.ch IBAN: CH72 0900 0000 8400 8704 1\nB2B: www.orellfuessli.ch BIC: POFICHBEXXX\n\ngeschaeftskunden@\norellfuessli.ch\n	invoice	Orell Fiissli Thalia AG	8404 Winterthur			46.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	CHF	paid	3a5437d4e1f826784d129c1dc31c7f4086cccaac6bc0ec229eb380d45223b57b	2025-05-19 20:03:30.042124	2025-05-19 21:12:15.267624	\N
18	Invoice-05EA1062-0038.pdf	/inbox/Invoice-05EA1062-0038.pdf	Invoice\n\nInvoice number O5EA1062-0038\nDate of issue February 28, 2025\n\nDate due February 28, 2025\n\nCOING Inc. Bill to\n\n2100 Geng Road Digital Assets Technologies AG\nSuite 210 billing@dat.ag\n\nPalo Alto, California 94303\nUnited States\n\n+1 855-738-8741\nsupport@clockify.me\n\n$29.97 USD due February 28, 2025\n\nPay online\n\nDescription\n\nClockify Subscription - Pro (Monthly)\nFeb 28 —- Mar 30, 2025\n\nSubtotal\nTotal\nAmount due\n\nPay annually and get 20% off!\n\n05EA1062-0038 - $29.97 USD due February 28, 2025\n\nShip to\n\nG\n\nDigital Assets Technologies AG\n\nQty\n\nUnit price\n(excl. tax)\n\n$9.99\n\nAmount\n(excl. tax)\n\n$29.97\n\n$29.97\n$29.97\n$29.97 USD\n\nPage 1 of 1\n	unknown					\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	pending	f627e066cf99d477d4422ff541dcf9d9a64965e7cee0fccf3b17709222239451	2025-05-19 21:21:29.259208	2025-05-19 21:21:29.333773	[0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375,0.1953125,0.5,0.953125,0.4609375,0.625,-0.5234375,0.96875,0.0390625,-0.6640625,0.7734375,0.4921875,-0.8515625,0.3359375,-0.6015625,0.6171875,-0.1875,0.1171875,0,-0.0078125,0.9296875,-0.8515625,-0.921875,-0.3125,-0.9921875,0.765625,0.1015625,-0.375,0.8125,0.46875,0.2734375,-0.3359375,-0.734375]
19	DigitalOcean Invoice 2025 Jan.pdf	/inbox/DigitalOcean Invoice 2025 Jan.pdf	4) DigitalOcean\n\nFinal invoice for the January 2025 billing period\n\nFrom\n\nDigitalOcean LLC\n\n105 Edgeview Drive, Suite 425\nBroomfield, CO, 80021\n\nVAT ID: CHE-357.901.451 MWST\n\nBilling Details\n\nTeam Blockonauts\n<andre@dat.ag>\nElse-Zublin-Strasse 94\nWinterthur, ZH, 8404\nSWITZERLAND\n\nSummary\n\nTotal usage charges\n\nInvoice Details\n\nInvoice number:\nDate of issue:\nPayment due on:\n\nTeam ID\n\ndo:team:a9d0abb1-1ba5-4b88-af01-0f938050a157\n\n504085758\n\nFebruary 1, 2025\nFebruary 1, 2025\n\nSubtotal\n\nVAT Switzerland (8.10%)\n\nTotal due\n\nProduct Usage Charges\n\nDetailed usage information is available via the API or can be downloaded from the billing section of your account\n\nDroplets\n\npassbolt-p01 (s-1lvcpu-2gb)\nerp-p01 (s-2vcpu-4gb)\n\nnfty-alerts (Ss-lvcpu-512mb-10gb)\ndat-stargate-01 (s-lvcpu-1gb)\nassets-dat-01 (s-lvcpu-1gb)\n\naccounting-p-dat-01 (s-2vcpu-4gb)\n\nDroplet Snapshots\n\npassbolt-p01-1707755441748 (fra1) 10.15GB Droplet Snapshot\n\nHours\n\n744\n\n744\n\n744\n\n744\n\n744\n\n744\n\nHours\n\n744\n\nStart\n\n01-01 00:00\n\n01-01 00:00\n\n01-01 00:00\n\n01-01 00:00\n\n01-01 00:00\n\n01-01 00:00\n\nStart\n\n01-01 00:00\n\nEnd\n\n02-01 00:00\n\n02-01 00:00\n\n02-01 00:00\n\n02-01 00:00\n\n02-01 00:00\n\n02-01 00:00\n\nEnd\n\n02-01 00:00\n\n$76.00\n$12.00\n$24.00\n$4.00\n$6.00\n$6.00\n\n$24.00\n\n$0.61\n\n$0.61\n\nPage 1 of 2\n\n\nDroplet Backups Hours Start End $2.40\n\npassbolt-p01 (Weekly Backup Services) 4 01-06 12:12 01-27 12:07 $2.40\n\nPage 2 of 2\n	unknown					\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	pending	89f6a31f4e81f77ad296125de675c211b432ebc94e6617c19fbc058ce29d50a9	2025-05-19 21:52:31.989535	2025-05-19 21:52:32.026272	[0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125,0.15625,-0.96875,0.4453125,0.4921875,-0.3515625,0.484375,-0.71875,0.4140625,0.0078125,0.8359375,-0.296875,-0.296875,0.65625,-0.3359375,0.265625,0.96875,0.0546875,0.65625,0.2734375,-0.8984375,-0.46875,-0.1015625,-0.8203125,0.9296875,0.84375,-0.4453125,0.9140625,0.9921875,0.328125,-0.5390625,-0.1015625,-0.703125]
22	351490935	/inbox/05092025_visaNa.pdf	Visana Services AG\nZahlungsverkehr\nWeltpoststrasse 19\n3000 Bern 16\n\nIhr Visana-Kontakt\nZahlungsverkehr\n031 357 93 00\nfie@visana.ch\n\nZahlungsaufforderung\n\nPia,\nVISANa\n\nAndré Wolke\nElse-Ziiblin-Strasse 94\n8404 Winterthur\n\nBern, 15. Mai 2025\n\nBelegnummer 5.056.623.05 / 351490935 (Bei Anfragen bitte immer angeben)\nZahlungseingange beriicksichtigt bis: 09.05.2025\n\nBelegnummer 340895416\n\nFalligkeit Betrag\n\nAndré Wolke, 11.04.1974, 5.056.623.05\nElse-Zublin-Strasse 94, 8404 Winterthur\nPramie KVG 01.03.2025 - 31.03.2025 01.03.2025 572.85\n\n— Belegnummer 343858220\n\nAndré Wolke, 11.04.1974, 5.056.623.05\n\nElse-Zublin-Strasse 94, 8404 Winterthur\n\nLeistungsabrechnung vom 08.02.2025\n\nRechnung: Medbase Apotheke Winterthur Oberi\n\nBehandlung vom 17.01.2025 - 17.01.2025 10.03.2025 66.25\n\nMahnkosten\n\n15.05.2025 50.00\n\nTotal Forderung KVG (Krankenversicherungsgesetz) 639.10\n\nVersicherungsschutz und -trager gemass Police\n\nSaldo zu unseren Gunsten\n\nDer verfallene Ausstand ist innert 30 Tagen zu Uberweisen.\n\nTotal CHF |\n\n572.85\n\n66.25\n\n50.00\n\n689.10\n\nDie Ausfiihrungen auf der letzten Seite dieses Dokuments informieren Sie Uber die Rechtsfolgen\nsowie unser weiteres Vorgehen im Falle der Nichtzahlung des ausstehenden Betrages innert 30\nTagen. Bitte beachten Sie hierbei insbesondere die Auswirkungen auf die Leistungspflicht. Sollte\n\n15220 5/7 XL\n\nVisana Services AG\nWeltpoststrasse 19, 3000 Bern 16, visana.ch\n\nSeite 1 von 3\n\n\na\nVISANA\n\nZahlungsaufforderung vom 15. Mai 2025\n\nBelegnummer 5.056.623.05 / 351490935\n\nErlauterungen zur Zahlungsaufforderung\n\nBis zum Versand dieser Mitteilung konnten wir noch keine Zahlung Ihrerseits verbuchen. Sollte\nIhre Vergiitung bereits unterwegs sein, betrachten Sie dieses Schreiben als hinfallig. Andernfalls\nist der Ausstand binnen 30 Tagen, vom Datum der Zahlungsaufforderung an gerechnet zu\nUberweisen. Fur weitere Inkassomassnahmen werden Ihnen zusatzlich Bearbeitungsgebuhren\nbelastet. Wir weisen Sie zudem darauf hin, dass die Nichtbegleichung der Ausstande\nunterschiedliche Auswirkungen je nach Versicherungsdeckung nach sich zieht:\n\nObligatorische Krankenpflegeversicherung nach KVG\n\nDie Pramienausstande werden nach Ablauf der Zahlungsaufforderungsfrist auf dem ordentlichen\nRechtsweg eingefordert, wobei alle im Zeitpunkt der Betreibung zur Zahlung falligen Betrage\nund Zinsen gem. Art. 26 ATSG eingeschlossen werden. Auf Verlangen des Kantons kann der\nbetriebene Schuldner der zustandigen kantonalen Stelle gemeldet und die Leistungen bis zur\nBegleichung der ausstehenden Forderungen aufgeschoben werden (Art. 64a KVG). Ein\nWechsel zu einem anderen Versicherer ist nur méglich, wenn eine fristgerechte KUndigung\nvorliegt und gemass Art. 64a KVG alle falligen Rechnungen beglichen sind (Pramien,\nKostenbeteiligungen, Verzugszinsen und Betreibungskosten).\n\nTaggeldversicherung nach KVG\n\nWenn der Ruckstand mehr als 90 Tage betragt, wird gemass unseren allgemeinen\nVersicherungsbedingungen die Leistungsberechtigung eingestellt, und der Pramienausstand\ninkl. Zinsen und Kosten wird nach Ablauf der Zahlungsaufforderungsfrist auf dem rechtlichen\nWeg eingefordert. Bleiben die Pramien Unbezahit, sind wir berechtigt, die versicherte Person\naus der Versicherung auszuschliessen.\n\nBitte begleichen Sie diesen Betrag bis zum 14. Juni 2025.\n\nEmpfangsschein\n\nKonto / Zahibar an\n\nZahiteil\n\nSeite 3 von 3\n\nKonto / Zahibar an\nCH15 3000 0001 3000 1242 8\n\nCH15 3000 0001 3000 1242 8 Visana AG\nVisana AG Weltpoststrasse 19\nWeltpoststrasse 19 3015 Bern\n3015 Bern CH\nCH\nReferenz\n\nReferenz\n\n11 03514 90935 05056 62305 00119\nZahlbar durch\nAndré Wolke\n\nElse-Zuiblin-Strasse 94\n8404 Winterthur\n\nWahrung Betrag\nCHF 689.10\n\nAnnahmestelle\n\n15220 7/7 XP\n\n11 03514 90935 05056 62305 00119\n\nZusatzliche Informationen\n\nFalligkeit: 14.06.2025\n\nZahibar durch\n\nAndré Wolke\nWah 8 Else-Ziiblin-Strasse 94\nahrung etrag\nCHF 689.10 8404 Winterthur\n	invoice	Visana Service AG	Else-Ziiblin-Strasse 94		2025-05-23	572.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	CHF	unpaid	8b3af22d22c8d47e8735d60e17f84bb8f79dd609e1dfea29678e6fb609321ff9	2025-05-19 22:04:44.474949	2025-05-19 22:47:10.602821	[0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375,0.8046875,-0.71875,-0.90625,0.453125,-0.984375,-0.125,-0.1796875,-0.90625,-0.1796875,0.90625,0.125,-0.4921875,0.9375,0,-1,-0.0859375,0.8125,-0.2890625,-0.359375,-0.109375,-0.21875,0.03125,0.625,-0.8125,-0.6796875,-0.140625,0.203125,-0.125,0.0859375,0.625,-0.5078125,0.7109375]
21	3514909400	/inbox/04012025_visaNa.pdf	—_—\nVISANa\n\nVisana Services AG\nZahlungsverkehr\nWeltpoststrasse 19\n3000 Bern 16\n\nIhr Visana-Kontakt\nZahlungsverkehr\n031 357 93 00\nfie@visana.ch\n\nZahlungserinnerung\n\nBelegnummer 344969771\n\nAndré Wolke, 11.04.1974, 5.056.623.05\nElse-Zublin-Strasse 94, 8404 Winterthur\nPramie KVG 01.04.2025 - 30.04.2025\nPramie VVG 01.04.2025 - 30.04.2025\n\nMahnkosten\n\nTotal Forderung KVG (Krankenversicherungsgesetz)\nTotal Forderung VVG (Versicherungsvertragsgesetz)\nVersicherungsschutz und -trager gemass Police\n\nSaldo zu unseren Gunsten\n\nAndré Wolke\nElse-Ziiblin-Strasse 94\n8404 Winterthur\n\nBern, 15. Mai 2025\n\nBelegnummer §.056.623.05 / 351490940 (Bei Anfragen bitte immer angeben)\nZahlungseingange beriicksichtigt bis: 09.05.2025\n\nFAlligkeit Betrag\n01.04.2025 572.85\n01.04.2025 112.10\n15.05.2025 5.00\n\n572.85\n112.10\n\nTotal CHF\n\n684.95\n\n5.00\n\n689.95\n\nWir bitten Sie, diese Zahlungserinnerung zu Uberpriifen und uns den verfallenen Betrag innert\n\n15 Tagen zu Uberweisen. Besten Dank.\n\nVereinfachen Sie Ihren Zahlungsverkehr mit dem Lastschriftverfahren der Banken (LSV) und der\nPost (Direct Debit). Ihre Agentur gibt gerne Auskunft. Oder melden Sie sich in Ihrem E-Banking\nfur eBill an und bezahlen Ihre Rechnungen schnell und sicher.\n\nBitte beachten Sie die Ausflihrungen auf der letzten Seite dieses Dokuments. Diese informieren\nSie Uber die Rechtsfolgen im Falle der Nichtzahlung sowie die Gebiihr bei einer weiteren\nZahlungsaufforderung. Sollte sich dieses Schreiben mit Ihrer Uberweisung gekreuzt haben, so\nbetrachten Sie dieses bitte als gegenstandslos. Besten Dank.\n\nStarik Visana Services AG\ni Weltpoststrasse 19, 3000 Bern 16, visana.ch\n15220 3/7 XL\n\nSeite 1 von 2\n\n\nZahlungserinnerung vom 15. Mai 2025\n\nBelegnummer\n\n—_\nVISANa\n\n5.056.623.05 / 35149094\n\nHinweise zum Inkasso von ausstehenden Pramien und/oder Kostenbeteiligungen\n\nWenn die Zahlungen fir fallige Rechnungen von Pramien und/oder Kostenbeteiligungen nicht\nfristgerecht bei uns eintreffen, erhalten die Versicherten automatisch eine Zahlungserinnerung.\nWenn Zahlungen fiir ausstehende Pramien- und/oder Kostenbeteiligungen trotz der\nZahlungserinnerung nicht bei uns eintreffen, fUhrt dies zu einer Zahlungsaufforderung mit\nunterschiedlichen Auswirkungen je nach Versicherungsdeckung:\n\nObligatorische Krankenpflegeversicherung und Taggeldversicherung nach KVG\n\nDen betroffenen Versicherten wird eine Zahlungsaufforderung zugestellt. Gleichzeitig wird eine\nGebuhr von CHF 50.00 fallig und in Rechnung gestellt. Es wird eine letzte Zahlungsfrist von 30\nTagen ab dem Datum der Zahlungsaufforderung eingeraumt.\n\nWenn auch diese Zahlungsfrist nicht eingehalten wird, mUssen die Pramien und/oder\nKostenbeteiligungen aus der obligatorischen Krankenpflegeversicherung und\nTaggeldversicherung nach KVG auf dem Betreibungsweg eingefordert und auf den\nVersicherungspramien entsprechende Zinsen (Art. 26 ATSG) erhoben werden.\n\nZusatzversicherungen nach VVG\nDen betroffenen Versicherten wird eine Zahlungsaufforderung flr die Zusatzversicherungen\n\nzugestellt. Gleichzeitig wird eine Gebtihr von CHF 10.00 fallig und in Rechnung gestellt. Es wird\neine letzte Zahlungsfrist von 14 Tagen ab dem Datum der Zahlungsaufforderung eingeraumt.\nWenn auch diese Zahlungsfrist nicht eingehalten wird, ruht fur die Zusatzversicherung nach\nVVG die Leistungspflicht so lange, bis samtliche Ausstande (Pramien, Zinsen und Kosten) fur\ndie Zusatzversicherungen vollstandig beglichen sind. Die Forderungen werden notfalls durch\nBetreibung eingefordert. Fur die Zeit der Leistungssperre k6nnen ruickwirkend keine Leistungen\ngeltend gemacht werden.\n\nBitte begleichen Sie diesen Betrag bis zum 30. Mai 2025. Seite 2 von 2\n\nEmpfangsschein\n\nKonto / Zahlbar an\n\nCH15 3000 0001 3000 1242 8\nVisana AG\n\nWeltpoststrasse 19\n\n3015 Bern\n\nCH\n\nReferenz\n\n11 03514 90940 05056 62305 00112\nZahlbar durch\nAndré Wolke\n\nElse-Zublin-Strasse 94\n8404 Winterthur\n\nWahrung Betrag\nCHF 689.95\n\nAnnahmestelle\n\n15220 4/7 FXP\n\nZahiteil\n\nWahrung\nCHF\n\nBetrag\n689.95\n\nKonto / Zahibar an\n\nCH15 3000 0001 3000 1242 8\nVisana AG\n\nWeltpoststrasse 19\n\n3015 Bern\n\nCH\n\nReferenz\n\n11 03514 90940 05056 62305 00112\n\nZusatzliche Informationen\n\nFalligkeit: 30.05.2025\n\nZahlbar durch\n\nAndré Wolke\nElse-Ziiblin-Strasse 94\n8404 Winterthur\n	invoice	Visana Service AG		3000 Bern 16	2025-05-23	689.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	USD	Unpaid	0858126567523314837f906dbd69aae217dda0a217537bbee10d0c879d6a95ea	2025-05-19 21:57:46.842857	2025-05-19 22:47:26.111319	[-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75,-0.609375,0.703125,0.0625,0.7578125,-0.0703125,-0.7734375,-0.90625,-0.1484375,0.1484375,-0.265625,-0.3671875,-0.7421875,0.1875,-0.6953125,0.71875,0.109375,0.6171875,-0.1015625,-0.859375,0.171875,-0.5703125,0.3125,0.796875,0.3984375,0.9140625,0.7265625,0.0546875,-0.2578125,0.65625,0.640625,-0.546875,0.75]
20	351490938	/inbox/04111974_visaNa.pdf	aioe,"\nVISANAa\n\nP.P. CH-3000 Bern 15\n\nPost CHAG i\nproclima\n\nVisana Services AG André Wolke\nZahlungsverkehr Else-Ziiblin-Strasse 94\nWeltpoststrasse 19 8404 Winterthur\n\n3000 Bern 16\nIhr Visana-Kontakt\nZahlungsverkehr\n\n031 357 93 00\nfie@visana.ch\n\nBern, 15. Mai 2025\n\nZahlungsaufforderung fiir die Zusatzversicherungen VVG\n\nFalligkeit\nBelegnummer 351490913\nAndré Wolke, 11.04.1974, 5.056.623.05\nElse-Ziiblin-Strasse 94, 8404 Winterthur\nPramie VVG 01.03.2025 - 31.03.2025 01.03.2025\nMahnkosten 15.05.2025\n\nTotal Forderung VVG (Versicherungsvertragsgesetz)\nVersicherungsschutz und -trager gemass Police\nSaldo zu unseren Gunsten\n\nDer verfallene Ausstand ist innert 14 Tagen zu Uberweisen.\n\nBelegnummer §.056.623.05 / 351490938 (Bei Anfragen bitte immer angeben)\nZahlungseingange bericksichtigt bis: 09.05.2025\n\nBetrag\n\n112.10\n\n10.00\n\n112.10\n\nTotal CHF\n\n112.10\n\n10.00\n\n122.10\n\nDie Ausfihrungen auf der letzten Seite dieses Dokuments informieren Sie Uber die Rechtsfolgen\nsowie unser weiteres Vorgehen im Falle der Nichtzahlung des ausstehenden Betrages innert 14\nTagen. Bitte beachten Sie hierbei insbesondere die Auswirkungen auf die Leistungspflicht. Sollte\nsich dieses Schreiben mit Ihrer Uberweisung gekreuzt haben, so betrachten Sie dieses bitte als\n\ngegenstandslos. Besten Dank.\n\nVisana Services AG\n\nWeltpoststrasse 19, 3000 Bern 16, visana.ch\n15220 1/7 XL\n\nSeite 1 von 2\n\n\nie\nVISANAa\n\nZahlungsaufforderung fiir die Zusatzversicherungen VVG vom 15. Mai 2025\n\nBelegnummer 5.056.623.05 / 351490938\n\nErlauterungen zur Zahlungsaufforderung\n\nBis zum Versand dieser Mitteilung konnten wir noch keine Zahlung Ihrerseits verbuchen. Sollte\nlhre Vergiitung bereits unterwegs sein, betrachten Sie dieses Schreiben als hinfallig. Andernfalls\nist der Ausstand binnen 14 Tagen, vom Datum der Zahlungsaufforderung an gerechnet, zu\nuiberweisen. Fur weitere Inkassomassnahmen werden Ihnen zusatzlich Bearbeitungsgebuhren\nbelastet. Wir weisen Sie zudem darauf hin, dass die Nichtbegleichung der Ausstande die\nfolgenden Wirkungen nach sich zieht:\n\nZusatzversicherung nach VVG\n\nMit der vorliegenden Zahlungsaufforderung sind unsererseits die Vorschriften des\nBundesgesetzes Uber den Versicherungsvertrag (Art. 20 und 21) erfullt. Nach Ablauf der\nZahlungsaufforderungsfrist von 14 Tagen ruht unsere Leistungspflicht bis zur vollstandigen\nBezahlung der Pramien, Zinsen und Kosten. Innerhalb von zwei Monaten nach Ablauf der\nZahlungsaufforderungsfrist hat der Versicherer die Wahl, die Ausstande zu betreiben oder unter\nVerzicht auf die Bezahlung der ruckstandigen Pramien vom Vertrag zuruckzutreten. Wenn\nvorher nicht betrieben oder der Riicktritt erklart wird, fallt der Vertrag nach Ablauf der\nzweimonatigen Frist ohne Weiteres dahin. Die unter der auf der Zahlungsaufforderung\nvermerkten Belegnummer versicherten Personen werden nach Dahinfallen des Vertrages nicht\nmehr Uber die entsprechende Versicherungsdeckung verflgen. Ruht die Leistungspflicht\nwahrend der Leistungs-Beobachtungsperiode (1.7. bis 30.6. des Folgejahres) langer als neun\nMonate, entfallt im Weiteren ein allfalliger Schadenfreiheitsrabatt.\n\nBitte begleichen Sie diesen Betrag bis zum 29. Mai 2025. Seite 2 von 2\n\nEmpfangsschein - Zahiteil Konto / Zahlbar an\nCH15 3000 0001 3000 1242 8\n\nKonto / Zahlbar an .\nCH15 3000 0001 3000 1242 8 Visana AG\nVisana AG Weltpoststrasse 19\nWeltpoststrasse 19 3015 Bern\n3015 Bern CH\nCH\n\nReferenz\n\n11 03514 90938 05056 62305 00117\n\nZahlibar durch\n\nAndré Wolke\nElse-Ziiblin-Strasse 94\n8404 Winterthur\n\nWahrung\n\nCHF\n\nse Ve\n\nReferenz\n\n11 03514 90938 05056 62305 00117\n\nZusatzliche Informationen\n\nFalligkeit: 29.05.2025\n\nZahlbar durch\nAndré Wolke\nElse-Ziblin-Strasse 94\n\nBetrag Wahrung Betrag\n122.10 | CHF 422.10 8404 Winterthur\n\nAnnahmestelle\n\n18220 2/7 XP\n	invoice	Visana Service AG	Bern		2025-05-23	122.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	CHF	Pending	93ac0b2904e26cb073895ffa8205afc64481c1654ad701949da348430b3a7b25	2025-05-19 21:52:59.228228	2025-05-19 22:47:40.875663	[-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875,-0.765625,-0.5703125,0.78125,0.390625,-0.9296875,0.6953125,-0.140625,-0.2890625,0.2109375,0.2265625,-0.6796875,-0.703125,0.4453125,0.078125,0.625,-0.015625,0.0390625,-0.125,0.5546875,0.5234375,0.765625,0.0234375,0.546875,-0.796875,0.390625,-0.9609375,-0.1875,-0.0078125,0.703125,-0.640625,0.9453125,0.6875]
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, is_read, created_at, document_id) FROM stdin;
1	Due: Invoice r	Document 'Invoice r' is due on February 20, 2025.	reminder	f	2025-05-19 20:02:36.941408	1
2	Due: Sales receipt / Invoice order 126950431	Document 'Sales receipt / Invoice order 126950431' is due on 1953.00.	reminder	f	2025-05-19 20:03:08.855639	3
3	Due: DigitalOcean	Document 'DigitalOcean' is due on April 1, 2025.	reminder	f	2025-05-19 20:03:43.296997	7
4	Due: Invoice	Document 'Invoice' is due on 2025-03-30.	reminder	f	2025-05-19 20:03:50.267473	8
5	Due: e12b63b9-a7af-4679-87a6-6b3d0fe8ce51.pdf	Document 'e12b63b9-a7af-4679-87a6-6b3d0fe8ce51.pdf' is due on 18.12.2023.	reminder	f	2025-05-19 20:04:04.157024	9
6	Due: VisANAa	Document 'VisANAa' is due on Not clear or off-topic.	reminder	f	2025-05-19 21:52:59.258675	20
7	Upcoming: 351490935	Document '351490935' is due in 3 days (2025-05-23).	reminder	f	2025-05-20 01:59:59.785067	22
8	Upcoming: 3514909400	Document '3514909400' is due in 3 days (2025-05-23).	reminder	f	2025-05-20 01:59:59.794107	21
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, name, created_at) FROM stdin;
1	CHF1.60	2025-05-19 20:02:36.919217
2	GST	2025-05-19 20:02:36.930117
3	VAT	2025-05-19 20:02:36.934495
4	Product number	2025-05-19 20:03:08.849759
5	Serial number	2025-05-19 20:03:08.85238
6	Warranty services	2025-05-19 20:03:08.85324
7	General terms and conditions	2025-05-19 20:03:08.853999
8	Mastercard	2025-05-19 20:03:17.19409
9	Coupon discount	2025-05-19 20:03:17.196178
10	Kette Brutto MwSt	2025-05-19 20:03:30.025836
11	Kette Netto MwSt	2025-05-19 20:03:30.030317
12	Kette Brutto MW 0.27 CHF	2025-05-19 20:03:30.032941
13	Kette Netto MW 0.25 CHF	2025-05-19 20:03:30.036048
14	Kette Brutto MW 1.42 CHF	2025-05-19 20:03:30.038314
15	Kette Netto MW 1.36 CHF	2025-05-19 20:03:30.040158
16	Kette Brutto MW 1.79 CHF	2025-05-19 20:03:30.040991
17	Kette Netto MW 1.78 CHF	2025-05-19 20:03:30.041721
18	Google	2025-05-19 20:03:35.810438
19	Cloud	2025-05-19 20:03:35.815272
20	Google Cloud	2025-05-19 20:03:35.825567
21	Droplets	2025-05-19 20:03:43.281373
22	hours	2025-05-19 20:03:43.286294
23	Droplet Snapshots	2025-05-19 20:03:43.290984
24	passbolt-p01 (Weekly Backup Services)	2025-05-19 20:03:43.292314
25	5	2025-05-19 20:03:43.293703
26	Clockify Subscription - Pro (Monthly)	2025-05-19 20:03:50.252766
27	Ship to	2025-05-19 20:03:50.264649
28	exkl. MwSt.	2025-05-19 20:04:04.143951
29	incl. MwSt.	2025-05-19 20:04:04.147658
30	Strom	2025-05-19 20:04:04.149069
31	Abfall	2025-05-19 20:04:04.150318
32	Summen	2025-05-19 20:04:04.151415
33	Rundungsdifferenz	2025-05-19 20:04:04.154496
39	Invoice	2025-05-19 20:04:41.657585
40	CHF1.45	2025-05-19 20:05:25.648446
41	SG GST M90375979C	2025-05-19 20:05:25.652056
42	CH VAT CHE-180.708.141 IVA	2025-05-19 20:05:25.655185
43	TRTIN 3312323741	2025-05-19 20:05:25.658961
44	SA VAT 312151778200003	2025-05-19 20:05:25.662473
45	CA GST/HST 772450227RT9999	2025-05-19 20:05:25.663515
46	IN GST 9924USA290350SB	2025-05-19 20:05:25.664296
47	JP TRN T5700150129266	2025-05-19 20:05:25.665133
48	CA PST-BC  PST-1486-2073	2025-05-19 20:05:25.665898
49	CA PST-SK 7975782	2025-05-19 20:05:25.666629
50	CA QST 1231841217TQ1001	2025-05-19 20:05:25.66735
51	VN TIN 9000001271	2025-05-19 20:05:25.668072
52	NO VAT 833914332MVA	2025-05-19 20:05:25.668789
60	VisANAa	2025-05-19 21:52:59.21941
61	Zahlungsverkehr	2025-05-19 21:52:59.225424
62	Kontakt	2025-05-19 21:52:59.226909
63	Sonder Status	2025-05-19 21:52:59.227785
64	Visanas	2025-05-19 21:57:46.828931
65	Zahlung	2025-05-19 21:57:46.840702
66	3000 Bern 16	2025-05-19 21:57:46.842212
67	Visa na	2025-05-19 22:04:44.471097
68	KVG	2025-05-19 22:04:44.473493
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, hashed_password, is_active, created_at, full_name, role, disabled) FROM stdin;
1	admin	admin@example.com	$2b$12$5ZZiqYV8dnTwu.mUjodkIOxCfgaETNTRO2jk1QOyJSRHW0.ikRak.	\N	2025-05-22 10:32:57.803727	Administrator	admin	f
2	viewer	viewer@example.com	$2b$12$mYKvmoVPJYWsyF0RE2WGpe0F4r1CYpanqy9CSYiJPoySqBEf20jCW	\N	2025-05-22 10:32:57.803727	View Only	viewer	f
\.


--
-- Name: address_book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.address_book_id_seq', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 22, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 8, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 68, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: address_book address_book_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.address_book
    ADD CONSTRAINT address_book_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkey PRIMARY KEY (version_num);


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
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


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
-- Name: idx_documents_embedding; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_embedding ON public.documents USING ivfflat (embedding public.vector_cosine_ops);


--
-- Name: ix_address_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_address_book_id ON public.address_book USING btree (id);


--
-- Name: ix_documents_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_documents_hash ON public.documents USING btree (hash);


--
-- Name: ix_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_documents_id ON public.documents USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_tags_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tags_id ON public.tags USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


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
-- PostgreSQL database dump complete
--

