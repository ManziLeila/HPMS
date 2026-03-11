--
-- PostgreSQL database dump
--

-- Dumped from database version 13.21
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY hpms_core.salaries DROP CONSTRAINT IF EXISTS salaries_period_id_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.salaries DROP CONSTRAINT IF EXISTS salaries_md_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_submitted_by_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_sent_to_bank_by_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_md_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_hr_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_client_id_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.employees DROP CONSTRAINT IF EXISTS employees_client_id_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.contracts DROP CONSTRAINT IF EXISTS contracts_template_id_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.client_contracts DROP CONSTRAINT IF EXISTS client_contracts_client_id_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.approval_history DROP CONSTRAINT IF EXISTS approval_history_period_id_fkey;
ALTER TABLE IF EXISTS ONLY hpms_core.approval_history DROP CONSTRAINT IF EXISTS approval_history_action_by_fkey;
DROP TRIGGER IF EXISTS trg_payroll_periods_updated ON hpms_core.payroll_periods;
DROP TRIGGER IF EXISTS trg_contracts_updated_at ON hpms_core.contracts;
DROP TRIGGER IF EXISTS trg_contract_templates_ts ON hpms_core.contract_templates;
DROP TRIGGER IF EXISTS trg_client_contracts_updated_at ON hpms_core.client_contracts;
DROP INDEX IF EXISTS hpms_core.idx_salaries_pay_period;
DROP INDEX IF EXISTS hpms_core.idx_salaries_employee_period;
DROP INDEX IF EXISTS hpms_core.idx_notifications_user;
DROP INDEX IF EXISTS hpms_core.idx_notifications_created;
DROP INDEX IF EXISTS hpms_core.idx_notifications_batch;
DROP INDEX IF EXISTS hpms_core.idx_employees_email_unique;
DROP INDEX IF EXISTS hpms_core.idx_employees_email;
DROP INDEX IF EXISTS hpms_core.idx_contracts_status;
DROP INDEX IF EXISTS hpms_core.idx_contracts_end_date;
DROP INDEX IF EXISTS hpms_core.idx_contracts_employee;
DROP INDEX IF EXISTS hpms_core.idx_contract_templates_type;
DROP INDEX IF EXISTS hpms_core.idx_client_contracts_status;
DROP INDEX IF EXISTS hpms_core.idx_client_contracts_end_date;
DROP INDEX IF EXISTS hpms_core.idx_client_contracts_client;
DROP INDEX IF EXISTS hpms_core.idx_audit_user_time;
DROP INDEX IF EXISTS hpms_core.idx_audit_action_time;
DROP INDEX IF EXISTS hpms_core.idx_approval_history_created;
DROP INDEX IF EXISTS hpms_core.idx_approval_history_action_by;
ALTER TABLE IF EXISTS ONLY hpms_core.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY hpms_core.salaries DROP CONSTRAINT IF EXISTS salaries_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.salaries DROP CONSTRAINT IF EXISTS salaries_employee_id_pay_period_key;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.payroll_periods DROP CONSTRAINT IF EXISTS payroll_periods_client_id_period_month_period_year_key;
ALTER TABLE IF EXISTS ONLY hpms_core.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.contracts DROP CONSTRAINT IF EXISTS contracts_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.contract_templates DROP CONSTRAINT IF EXISTS contract_templates_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.client_contracts DROP CONSTRAINT IF EXISTS client_contracts_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY hpms_core.approval_history DROP CONSTRAINT IF EXISTS approval_history_pkey;
ALTER TABLE IF EXISTS hpms_core.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.salaries ALTER COLUMN salary_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.payroll_periods ALTER COLUMN period_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.notifications ALTER COLUMN notification_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.employees ALTER COLUMN employee_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.contracts ALTER COLUMN contract_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.contract_templates ALTER COLUMN template_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.clients ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.client_contracts ALTER COLUMN contract_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.audit_logs ALTER COLUMN audit_id DROP DEFAULT;
ALTER TABLE IF EXISTS hpms_core.approval_history ALTER COLUMN history_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS hpms_core.users_user_id_seq;
DROP TABLE IF EXISTS hpms_core.users;
DROP SEQUENCE IF EXISTS hpms_core.salaries_salary_id_seq;
DROP TABLE IF EXISTS hpms_core.salaries;
DROP SEQUENCE IF EXISTS hpms_core.payroll_periods_period_id_seq;
DROP TABLE IF EXISTS hpms_core.payroll_periods;
DROP SEQUENCE IF EXISTS hpms_core.notifications_notification_id_seq;
DROP TABLE IF EXISTS hpms_core.notifications;
DROP SEQUENCE IF EXISTS hpms_core.employees_employee_id_seq;
DROP TABLE IF EXISTS hpms_core.employees;
DROP SEQUENCE IF EXISTS hpms_core.contracts_contract_id_seq;
DROP TABLE IF EXISTS hpms_core.contracts;
DROP SEQUENCE IF EXISTS hpms_core.contract_templates_template_id_seq;
DROP TABLE IF EXISTS hpms_core.contract_templates;
DROP SEQUENCE IF EXISTS hpms_core.clients_client_id_seq;
DROP TABLE IF EXISTS hpms_core.clients;
DROP SEQUENCE IF EXISTS hpms_core.client_contracts_contract_id_seq;
DROP TABLE IF EXISTS hpms_core.client_contracts;
DROP SEQUENCE IF EXISTS hpms_core.audit_logs_audit_id_seq;
DROP TABLE IF EXISTS hpms_core.audit_logs;
DROP SEQUENCE IF EXISTS hpms_core.approval_history_history_id_seq;
DROP TABLE IF EXISTS hpms_core.approval_history;
DROP FUNCTION IF EXISTS hpms_core.update_updated_at_column();
DROP FUNCTION IF EXISTS hpms_core.update_contracts_timestamp();
DROP FUNCTION IF EXISTS hpms_core.update_contract_templates_ts();
DROP FUNCTION IF EXISTS hpms_core.update_client_contracts_timestamp();
DROP FUNCTION IF EXISTS hpms_core.update_batch_summary();
DROP FUNCTION IF EXISTS hpms_core.touch_payroll_periods();
DROP FUNCTION IF EXISTS hpms_core.expire_old_contracts();
DROP FUNCTION IF EXISTS hpms_core.encrypt_text(value text, key text);
DROP FUNCTION IF EXISTS hpms_core.decrypt_text(value bytea, key text);
DROP TYPE IF EXISTS hpms_core.user_role;
DROP TYPE IF EXISTS hpms_core.employee_role;
DROP TYPE IF EXISTS hpms_core.audit_action;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS citext;
-- *not* dropping schema, since initdb creates it
DROP SCHEMA IF EXISTS hpms_core;
--
-- Name: hpms_core; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA hpms_core;


ALTER SCHEMA hpms_core OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: audit_action; Type: TYPE; Schema: hpms_core; Owner: postgres
--

CREATE TYPE hpms_core.audit_action AS ENUM (
    'LOGIN_REQUEST',
    'MFA_CHALLENGE',
    'ACCESS_GRANTED',
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'CREATE_SALARY',
    'UPDATE_SALARY',
    'DOWNLOAD_PAYSLIP',
    'DELETE_EMPLOYEE',
    'RESET_PERIOD',
    'BULK_UPLOAD_SALARIES',
    'BULK_SEND_PAYSLIP_EMAILS',
    'DELETE_SALARY'
);


ALTER TYPE hpms_core.audit_action OWNER TO postgres;

--
-- Name: employee_role; Type: TYPE; Schema: hpms_core; Owner: postgres
--

CREATE TYPE hpms_core.employee_role AS ENUM (
    'Employee'
);


ALTER TYPE hpms_core.employee_role OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: hpms_core; Owner: postgres
--

CREATE TYPE hpms_core.user_role AS ENUM (
    'FinanceOfficer',
    'HR',
    'ManagingDirector'
);


ALTER TYPE hpms_core.user_role OWNER TO postgres;

--
-- Name: decrypt_text(bytea, text); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.decrypt_text(value bytea, key text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN pgp_sym_decrypt(value, key, 'cipher-algo=aes256');
END
$$;


ALTER FUNCTION hpms_core.decrypt_text(value bytea, key text) OWNER TO postgres;

--
-- Name: encrypt_text(text, text); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.encrypt_text(value text, key text) RETURNS bytea
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN pgp_sym_encrypt(value, key, 'cipher-algo=aes256');
END
$$;


ALTER FUNCTION hpms_core.encrypt_text(value text, key text) OWNER TO postgres;

--
-- Name: expire_old_contracts(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.expire_old_contracts() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE hpms_core.contracts
  SET status = 'expired'
  WHERE status = 'active' AND end_date < CURRENT_DATE;
END;
$$;


ALTER FUNCTION hpms_core.expire_old_contracts() OWNER TO postgres;

--
-- Name: touch_payroll_periods(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.touch_payroll_periods() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION hpms_core.touch_payroll_periods() OWNER TO postgres;

--
-- Name: update_batch_summary(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.update_batch_summary() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update the batch summary when salaries are added/updated
    UPDATE hpms_core.payroll_batches
    SET 
        total_employees = (
            SELECT COUNT(*) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        total_gross_salary = (
            SELECT COALESCE(SUM(gross_salary), 0) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        total_net_salary = (
            SELECT COALESCE(SUM(net_salary), 0) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        total_deductions = (
            SELECT COALESCE(SUM(total_deductions), 0) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        total_rssb = (
            SELECT COALESCE(SUM(rssb_employee), 0) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        total_paye = (
            SELECT COALESCE(SUM(paye), 0) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        total_rama = (
            SELECT COALESCE(SUM(rama_insurance), 0) 
            FROM hpms_core.salaries 
            WHERE batch_id = NEW.batch_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE batch_id = NEW.batch_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION hpms_core.update_batch_summary() OWNER TO postgres;

--
-- Name: update_client_contracts_timestamp(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.update_client_contracts_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION hpms_core.update_client_contracts_timestamp() OWNER TO postgres;

--
-- Name: update_contract_templates_ts(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.update_contract_templates_ts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION hpms_core.update_contract_templates_ts() OWNER TO postgres;

--
-- Name: update_contracts_timestamp(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.update_contracts_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION hpms_core.update_contracts_timestamp() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: hpms_core; Owner: postgres
--

CREATE FUNCTION hpms_core.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION hpms_core.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approval_history; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.approval_history (
    history_id integer NOT NULL,
    action_by integer NOT NULL,
    action_type character varying(50) NOT NULL,
    comments text,
    previous_status character varying(50),
    new_status character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    period_id integer,
    CONSTRAINT approval_history_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['SUBMIT'::character varying, 'HR_APPROVE'::character varying, 'HR_REJECT'::character varying, 'MD_APPROVE'::character varying, 'MD_REJECT'::character varying, 'SEND_TO_BANK'::character varying, 'CANCEL'::character varying])::text[])))
);


ALTER TABLE hpms_core.approval_history OWNER TO postgres;

--
-- Name: approval_history_history_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.approval_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.approval_history_history_id_seq OWNER TO postgres;

--
-- Name: approval_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.approval_history_history_id_seq OWNED BY hpms_core.approval_history.history_id;


--
-- Name: audit_logs; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.audit_logs (
    audit_id bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer,
    action_type hpms_core.audit_action NOT NULL,
    details jsonb NOT NULL,
    ip_address inet,
    user_agent text,
    correlation_id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE hpms_core.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.audit_logs_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.audit_logs_audit_id_seq OWNER TO postgres;

--
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.audit_logs_audit_id_seq OWNED BY hpms_core.audit_logs.audit_id;


--
-- Name: client_contracts; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.client_contracts (
    contract_id integer NOT NULL,
    client_id integer NOT NULL,
    contract_type character varying(50) DEFAULT 'service-agreement'::character varying NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contract_document_path character varying(500)
);


ALTER TABLE hpms_core.client_contracts OWNER TO postgres;

--
-- Name: client_contracts_contract_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.client_contracts_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.client_contracts_contract_id_seq OWNER TO postgres;

--
-- Name: client_contracts_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.client_contracts_contract_id_seq OWNED BY hpms_core.client_contracts.contract_id;


--
-- Name: clients; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.clients (
    client_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    email character varying(255),
    contact_info text
);


ALTER TABLE hpms_core.clients OWNER TO postgres;

--
-- Name: clients_client_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.clients_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.clients_client_id_seq OWNER TO postgres;

--
-- Name: clients_client_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.clients_client_id_seq OWNED BY hpms_core.clients.client_id;


--
-- Name: contract_templates; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.contract_templates (
    template_id integer NOT NULL,
    name character varying(120) NOT NULL,
    description text,
    contract_type character varying(50) DEFAULT 'fixed-term'::character varying,
    body text DEFAULT ''::text NOT NULL,
    header_html text,
    footer_html text,
    is_default boolean DEFAULT false,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE hpms_core.contract_templates OWNER TO postgres;

--
-- Name: contract_templates_template_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.contract_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.contract_templates_template_id_seq OWNER TO postgres;

--
-- Name: contract_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.contract_templates_template_id_seq OWNED BY hpms_core.contract_templates.template_id;


--
-- Name: contracts; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.contracts (
    contract_id integer NOT NULL,
    employee_id integer NOT NULL,
    contract_type character varying(50) DEFAULT 'fixed-term'::character varying NOT NULL,
    job_title character varying(120) NOT NULL,
    department character varying(120),
    start_date date NOT NULL,
    end_date date,
    salary_grade character varying(40),
    gross_salary numeric(14,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    created_by integer,
    notified_30days boolean DEFAULT false,
    notified_14days boolean DEFAULT false,
    notified_7days boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    template_id integer,
    contract_document_path character varying(500)
);


ALTER TABLE hpms_core.contracts OWNER TO postgres;

--
-- Name: contracts_contract_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.contracts_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.contracts_contract_id_seq OWNER TO postgres;

--
-- Name: contracts_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.contracts_contract_id_seq OWNED BY hpms_core.contracts.contract_id;


--
-- Name: employees; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.employees (
    employee_id integer NOT NULL,
    full_name character varying(160) NOT NULL,
    email public.citext,
    bank_account_enc bytea,
    role hpms_core.employee_role NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    password_hash text,
    mfa_secret text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    encryption_version smallint DEFAULT 1 NOT NULL,
    bank_name text,
    account_number_enc bytea,
    account_holder_name text,
    phone_number text,
    email_notifications_enabled boolean DEFAULT true,
    sms_notifications_enabled boolean DEFAULT false,
    department text,
    date_of_joining date,
    is_active boolean DEFAULT true,
    rssb_number character varying(20) DEFAULT NULL::character varying,
    national_id character varying(50),
    client_id integer
);


ALTER TABLE hpms_core.employees OWNER TO postgres;

--
-- Name: employees_employee_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.employees_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.employees_employee_id_seq OWNER TO postgres;

--
-- Name: employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.employees_employee_id_seq OWNED BY hpms_core.employees.employee_id;


--
-- Name: notifications; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    batch_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone,
    action_url character varying(500),
    priority character varying(20) DEFAULT 'NORMAL'::character varying,
    user_type text DEFAULT 'user'::text NOT NULL,
    CONSTRAINT notifications_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'NORMAL'::character varying, 'HIGH'::character varying, 'URGENT'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['PAYROLL_SUBMITTED'::character varying, 'PAYROLL_HR_APPROVED'::character varying, 'PAYROLL_HR_REJECTED'::character varying, 'PAYROLL_MD_APPROVED'::character varying, 'PAYROLL_MD_REJECTED'::character varying, 'PAYROLL_SENT_TO_BANK'::character varying, 'APPROVAL_REMINDER'::character varying, 'BATCH_CANCELLED'::character varying])::text[])))
);


ALTER TABLE hpms_core.notifications OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.notifications_notification_id_seq OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.notifications_notification_id_seq OWNED BY hpms_core.notifications.notification_id;


--
-- Name: payroll_periods; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.payroll_periods (
    period_id integer NOT NULL,
    client_id integer NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    status character varying(50) DEFAULT 'SUBMITTED'::character varying NOT NULL,
    submitted_by integer,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    hr_reviewed_by integer,
    hr_reviewed_at timestamp with time zone,
    hr_comments text,
    md_reviewed_by integer,
    md_reviewed_at timestamp with time zone,
    md_comments text,
    sent_to_bank_by integer,
    sent_to_bank_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payroll_periods_period_month_check CHECK (((period_month >= 1) AND (period_month <= 12))),
    CONSTRAINT payroll_periods_period_year_check CHECK ((period_year >= 2020)),
    CONSTRAINT payroll_periods_status_check CHECK (((status)::text = ANY ((ARRAY['SUBMITTED'::character varying, 'HR_APPROVED'::character varying, 'MD_APPROVED'::character varying, 'REJECTED'::character varying, 'SENT_TO_BANK'::character varying])::text[])))
);


ALTER TABLE hpms_core.payroll_periods OWNER TO postgres;

--
-- Name: payroll_periods_period_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.payroll_periods_period_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.payroll_periods_period_id_seq OWNER TO postgres;

--
-- Name: payroll_periods_period_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.payroll_periods_period_id_seq OWNED BY hpms_core.payroll_periods.period_id;


--
-- Name: salaries; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.salaries (
    salary_id integer NOT NULL,
    employee_id integer NOT NULL,
    pay_period date NOT NULL,
    pay_frequency character varying(16) DEFAULT 'monthly'::character varying NOT NULL,
    basic_salary_enc bytea NOT NULL,
    transport_allow_enc bytea,
    housing_allow_enc bytea,
    variable_allow_enc bytea,
    performance_allow_enc bytea,
    gross_salary numeric(14,2) NOT NULL,
    rssb_pension numeric(14,2) NOT NULL,
    rssb_maternity numeric(14,2) NOT NULL,
    rama_insurance numeric(14,2) NOT NULL,
    paye numeric(14,2) NOT NULL,
    net_paid_enc bytea NOT NULL,
    total_employer_contrib numeric(14,2) NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    encryption_version smallint DEFAULT 1 NOT NULL,
    advance_amount numeric(12,2) DEFAULT 0,
    include_medical boolean DEFAULT true,
    payroll_snapshot_enc text,
    hr_status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    hr_comment text,
    hr_reviewed_at timestamp with time zone,
    hr_reviewed_by text,
    updated_at timestamp with time zone DEFAULT now(),
    period_id integer,
    md_status character varying(20) DEFAULT 'PENDING'::character varying,
    md_comment text,
    md_reviewed_at timestamp with time zone,
    md_reviewed_by integer
);


ALTER TABLE hpms_core.salaries OWNER TO postgres;

--
-- Name: COLUMN salaries.payroll_snapshot_enc; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.payroll_snapshot_enc IS 'Encrypted JSON snapshot of complete payroll calculation data used for PDF generation and email sending';


--
-- Name: COLUMN salaries.hr_status; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.hr_status IS 'HR review status: PENDING | HR_APPROVED | HR_REJECTED';


--
-- Name: COLUMN salaries.hr_comment; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.hr_comment IS 'Optional HR note visible to the Finance Officer';


--
-- Name: COLUMN salaries.hr_reviewed_by; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.hr_reviewed_by IS 'Which HR user reviewed this record (stored as text ID)';


--
-- Name: COLUMN salaries.md_status; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.md_status IS 'MD review status: PENDING | MD_APPROVED | MD_REJECTED';


--
-- Name: COLUMN salaries.md_comment; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.md_comment IS 'Optional MD note when rejecting';


--
-- Name: COLUMN salaries.md_reviewed_by; Type: COMMENT; Schema: hpms_core; Owner: postgres
--

COMMENT ON COLUMN hpms_core.salaries.md_reviewed_by IS 'Which MD user reviewed this record';


--
-- Name: salaries_salary_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.salaries_salary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.salaries_salary_id_seq OWNER TO postgres;

--
-- Name: salaries_salary_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.salaries_salary_id_seq OWNED BY hpms_core.salaries.salary_id;


--
-- Name: users; Type: TABLE; Schema: hpms_core; Owner: postgres
--

CREATE TABLE hpms_core.users (
    user_id integer NOT NULL,
    full_name text NOT NULL,
    email text,
    password_hash text,
    mfa_secret text,
    role hpms_core.user_role NOT NULL,
    department text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    mfa_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE hpms_core.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: hpms_core; Owner: postgres
--

CREATE SEQUENCE hpms_core.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE hpms_core.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: hpms_core; Owner: postgres
--

ALTER SEQUENCE hpms_core.users_user_id_seq OWNED BY hpms_core.users.user_id;


--
-- Name: approval_history history_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.approval_history ALTER COLUMN history_id SET DEFAULT nextval('hpms_core.approval_history_history_id_seq'::regclass);


--
-- Name: audit_logs audit_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.audit_logs ALTER COLUMN audit_id SET DEFAULT nextval('hpms_core.audit_logs_audit_id_seq'::regclass);


--
-- Name: client_contracts contract_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.client_contracts ALTER COLUMN contract_id SET DEFAULT nextval('hpms_core.client_contracts_contract_id_seq'::regclass);


--
-- Name: clients client_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.clients ALTER COLUMN client_id SET DEFAULT nextval('hpms_core.clients_client_id_seq'::regclass);


--
-- Name: contract_templates template_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.contract_templates ALTER COLUMN template_id SET DEFAULT nextval('hpms_core.contract_templates_template_id_seq'::regclass);


--
-- Name: contracts contract_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.contracts ALTER COLUMN contract_id SET DEFAULT nextval('hpms_core.contracts_contract_id_seq'::regclass);


--
-- Name: employees employee_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.employees ALTER COLUMN employee_id SET DEFAULT nextval('hpms_core.employees_employee_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.notifications ALTER COLUMN notification_id SET DEFAULT nextval('hpms_core.notifications_notification_id_seq'::regclass);


--
-- Name: payroll_periods period_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods ALTER COLUMN period_id SET DEFAULT nextval('hpms_core.payroll_periods_period_id_seq'::regclass);


--
-- Name: salaries salary_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.salaries ALTER COLUMN salary_id SET DEFAULT nextval('hpms_core.salaries_salary_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.users ALTER COLUMN user_id SET DEFAULT nextval('hpms_core.users_user_id_seq'::regclass);


--
-- Data for Name: approval_history; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.approval_history (history_id, action_by, action_type, comments, previous_status, new_status, created_at, ip_address, user_agent, metadata, period_id) FROM stdin;
1	3	HR_APPROVE		SUBMITTED	HR_APPROVED	2026-03-04 13:08:30.412647	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	{}	1
2	4	MD_APPROVE	MD final approval	HR_APPROVED	MD_APPROVED	2026-03-04 13:24:57.429303	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	{}	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.audit_logs (audit_id, "timestamp", user_id, action_type, details, ip_address, user_agent, correlation_id) FROM stdin;
1	2026-03-04 12:47:47.261582+02	2	BULK_UPLOAD_SALARIES	{"total": 8, "failed": 0, "payPeriod": "2026-03-01", "successful": 8}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	58102af4-c16f-4827-a101-74d2111bc4d8
2	2026-03-04 13:07:51.136469+02	3	ACCESS_GRANTED	{"method": "PASSWORD_ONLY", "sessionId": "d15b6dcd-71c1-49e3-9165-3ac063f7a4b1"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	47a7ea21-1065-4c67-8d28-7f39cf123fcc
3	2026-03-04 13:13:01.827692+02	4	ACCESS_GRANTED	{"method": "PASSWORD_ONLY", "sessionId": "7703ae3a-5a31-467b-bafe-c8aab25d5a8d"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	6ca40b00-3c88-4ff9-81ab-46e27b1c9d0d
4	2026-03-04 13:24:48.280868+02	4	ACCESS_GRANTED	{"method": "PASSWORD_ONLY", "sessionId": "277eabf3-70b4-4655-a423-63ca948b6e83"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	7605dcb8-acb8-4fb4-ae0b-8c5a512e3bb5
5	2026-03-04 13:59:40.770059+02	2	ACCESS_GRANTED	{"method": "PASSWORD_ONLY", "sessionId": "3c0aed21-6488-4bb8-bec5-1235c01a9b25"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	a8b17ba0-ad41-4656-8ab1-50c313575e4b
6	2026-03-04 15:07:58.280445+02	3	ACCESS_GRANTED	{"method": "PASSWORD_ONLY", "sessionId": "c933a546-20ee-473e-be78-c2bf6bead9eb"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	6c06046e-cf55-47ab-84e7-6ffc30a27e03
7	2026-03-04 15:10:07.462069+02	2	ACCESS_GRANTED	{"method": "PASSWORD_ONLY", "sessionId": "0099a189-e621-46c3-8b6e-3ed031e74e11"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	9c3017c9-8af3-42cf-bf57-d39baf492374
8	2026-03-04 15:18:41.851297+02	2	BULK_UPLOAD_SALARIES	{"total": 8, "failed": 0, "payPeriod": "2026-04-01", "successful": 8}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	3c910fe9-6ebc-4ef3-a10b-36f12290f57d
\.


--
-- Data for Name: client_contracts; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.client_contracts (contract_id, client_id, contract_type, start_date, end_date, status, notes, created_at, updated_at, contract_document_path) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.clients (client_id, name, description, created_at, email, contact_info) FROM stdin;
5	illovo	\N	2026-03-04 12:40:39.525966	illovo@gmail.com	\N
\.


--
-- Data for Name: contract_templates; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.contract_templates (template_id, name, description, contract_type, body, header_html, footer_html, is_default, created_by, created_at, updated_at) FROM stdin;
1	HC Solutions Standard Employment Contract	Default template for full-time employees	fixed-term	EMPLOYMENT CONTRACT\n\nThis Employment Contract ("Agreement") is entered into as of {{start_date}}, between:\n\nEMPLOYER:\nHC Solutions Ltd\nKigali, Rwanda\n("The Company")\n\nEMPLOYEE:\nFull Name: {{full_name}}\nEmail: {{email}}\nDepartment: {{department}}\n\n──────────────────────────────────────────\n1. POSITION & DUTIES\n──────────────────────────────────────────\nThe Employee is hired as {{job_title}} in the {{department}} department.\nThe Employee agrees to perform all duties assigned by management diligently and professionally.\n\n──────────────────────────────────────────\n2. CONTRACT DURATION\n──────────────────────────────────────────\nContract Type: {{contract_type}}\nStart Date:    {{start_date}}\nEnd Date:      {{end_date}}\n\nThis contract may be renewed by mutual written agreement before the end date.\n\n──────────────────────────────────────────\n3. REMUNERATION\n──────────────────────────────────────────\nGross Monthly Salary: {{gross_salary}} RWF\nSalary Grade:         {{salary_grade}}\n\nSalary shall be paid monthly, subject to statutory deductions (PAYE, RAMA, Pension).\n\n──────────────────────────────────────────\n4. WORKING HOURS\n──────────────────────────────────────────\nStandard working hours are 40 hours per week, Monday to Friday.\nOvertime is subject to the Rwanda Labour Law provisions.\n\n──────────────────────────────────────────\n5. LEAVE ENTITLEMENT\n──────────────────────────────────────────\nThe Employee is entitled to 18 days of annual leave per year.\nMaternity/Paternity leave as per Rwanda Labour Code.\n\n──────────────────────────────────────────\n6. CONFIDENTIALITY\n──────────────────────────────────────────\nThe Employee shall maintain strict confidentiality of all company data, client information, and financial records.\n\n──────────────────────────────────────────\n7. TERMINATION\n──────────────────────────────────────────\nEither party may terminate this agreement with 30 days written notice.\nThe Company may terminate immediately for gross misconduct.\n\n──────────────────────────────────────────\n8. GOVERNING LAW\n──────────────────────────────────────────\nThis Agreement is governed by the laws of the Republic of Rwanda.\n\n──────────────────────────────────────────\nSIGNATURES\n──────────────────────────────────────────\n\nEmployee: _______________________    Date: _______________\n          {{full_name}}\n\nEmployer: _______________________    Date: _______________\n          Authorized Representative\n          HC Solutions Ltd\n\n\n— Additional Notes —\n{{notes}}	\N	\N	t	\N	2026-02-24 14:51:44.145634+02	2026-02-24 14:51:44.145634+02
2	HC Solutions Standard Employment Contract	Default template for full-time employees	fixed-term	EMPLOYMENT CONTRACT\n\nThis Employment Contract ("Agreement") is entered into as of {{start_date}}, between:\n\nEMPLOYER:\nHC Solutions Ltd\nKigali, Rwanda\n("The Company")\n\nEMPLOYEE:\nFull Name: {{full_name}}\nEmail: {{email}}\nDepartment: {{department}}\n\n──────────────────────────────────────────\n1. POSITION & DUTIES\n──────────────────────────────────────────\nThe Employee is hired as {{job_title}} in the {{department}} department.\nThe Employee agrees to perform all duties assigned by management diligently and professionally.\n\n──────────────────────────────────────────\n2. CONTRACT DURATION\n──────────────────────────────────────────\nContract Type: {{contract_type}}\nStart Date:    {{start_date}}\nEnd Date:      {{end_date}}\n\nThis contract may be renewed by mutual written agreement before the end date.\n\n──────────────────────────────────────────\n3. REMUNERATION\n──────────────────────────────────────────\nGross Monthly Salary: {{gross_salary}} RWF\nSalary Grade:         {{salary_grade}}\n\nSalary shall be paid monthly, subject to statutory deductions (PAYE, RAMA, Pension).\n\n──────────────────────────────────────────\n4. WORKING HOURS\n──────────────────────────────────────────\nStandard working hours are 40 hours per week, Monday to Friday.\nOvertime is subject to the Rwanda Labour Law provisions.\n\n──────────────────────────────────────────\n5. LEAVE ENTITLEMENT\n──────────────────────────────────────────\nThe Employee is entitled to 18 days of annual leave per year.\nMaternity/Paternity leave as per Rwanda Labour Code.\n\n──────────────────────────────────────────\n6. CONFIDENTIALITY\n──────────────────────────────────────────\nThe Employee shall maintain strict confidentiality of all company data, client information, and financial records.\n\n──────────────────────────────────────────\n7. TERMINATION\n──────────────────────────────────────────\nEither party may terminate this agreement with 30 days written notice.\nThe Company may terminate immediately for gross misconduct.\n\n──────────────────────────────────────────\n8. GOVERNING LAW\n──────────────────────────────────────────\nThis Agreement is governed by the laws of the Republic of Rwanda.\n\n──────────────────────────────────────────\nSIGNATURES\n──────────────────────────────────────────\n\nEmployee: _______________________    Date: _______________\n          {{full_name}}\n\nEmployer: _______________________    Date: _______________\n          Authorized Representative\n          HC Solutions Ltd\n\n\n— Additional Notes —\n{{notes}}	\N	\N	t	\N	2026-03-03 14:12:24.292774+02	2026-03-03 14:12:24.292774+02
3	HC Solutions Standard Employment Contract	Default template for full-time employees	fixed-term	EMPLOYMENT CONTRACT\n\nThis Employment Contract ("Agreement") is entered into as of {{start_date}}, between:\n\nEMPLOYER:\nHC Solutions Ltd\nKigali, Rwanda\n("The Company")\n\nEMPLOYEE:\nFull Name: {{full_name}}\nEmail: {{email}}\nDepartment: {{department}}\n\n──────────────────────────────────────────\n1. POSITION & DUTIES\n──────────────────────────────────────────\nThe Employee is hired as {{job_title}} in the {{department}} department.\nThe Employee agrees to perform all duties assigned by management diligently and professionally.\n\n──────────────────────────────────────────\n2. CONTRACT DURATION\n──────────────────────────────────────────\nContract Type: {{contract_type}}\nStart Date:    {{start_date}}\nEnd Date:      {{end_date}}\n\nThis contract may be renewed by mutual written agreement before the end date.\n\n──────────────────────────────────────────\n3. REMUNERATION\n──────────────────────────────────────────\nGross Monthly Salary: {{gross_salary}} RWF\nSalary Grade:         {{salary_grade}}\n\nSalary shall be paid monthly, subject to statutory deductions (PAYE, RAMA, Pension).\n\n──────────────────────────────────────────\n4. WORKING HOURS\n──────────────────────────────────────────\nStandard working hours are 40 hours per week, Monday to Friday.\nOvertime is subject to the Rwanda Labour Law provisions.\n\n──────────────────────────────────────────\n5. LEAVE ENTITLEMENT\n──────────────────────────────────────────\nThe Employee is entitled to 18 days of annual leave per year.\nMaternity/Paternity leave as per Rwanda Labour Code.\n\n──────────────────────────────────────────\n6. CONFIDENTIALITY\n──────────────────────────────────────────\nThe Employee shall maintain strict confidentiality of all company data, client information, and financial records.\n\n──────────────────────────────────────────\n7. TERMINATION\n──────────────────────────────────────────\nEither party may terminate this agreement with 30 days written notice.\nThe Company may terminate immediately for gross misconduct.\n\n──────────────────────────────────────────\n8. GOVERNING LAW\n──────────────────────────────────────────\nThis Agreement is governed by the laws of the Republic of Rwanda.\n\n──────────────────────────────────────────\nSIGNATURES\n──────────────────────────────────────────\n\nEmployee: _______________________    Date: _______________\n          {{full_name}}\n\nEmployer: _______________________    Date: _______________\n          Authorized Representative\n          HC Solutions Ltd\n\n\n— Additional Notes —\n{{notes}}	\N	\N	t	\N	2026-03-03 14:13:27.115256+02	2026-03-03 14:13:27.115256+02
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.contracts (contract_id, employee_id, contract_type, job_title, department, start_date, end_date, salary_grade, gross_salary, status, notes, created_by, notified_30days, notified_14days, notified_7days, created_at, updated_at, template_id, contract_document_path) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.employees (employee_id, full_name, email, bank_account_enc, role, status, password_hash, mfa_secret, created_at, updated_at, encryption_version, bank_name, account_number_enc, account_holder_name, phone_number, email_notifications_enabled, sms_notifications_enabled, department, date_of_joining, is_active, rssb_number, national_id, client_id) FROM stdin;
1	Claudette  Gikundiro	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:46.849364+02	2026-03-04 12:47:46.849364+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655126 Q	\N	5
2	Ndayambaje	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.206768+02	2026-03-04 12:47:47.206768+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655106 C	\N	5
3	Ingabire Francine	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.213105+02	2026-03-04 12:47:47.213105+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655077 A	\N	5
4	Benimana Jean Felix	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.217586+02	2026-03-04 12:47:47.217586+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655059 C	\N	5
5	Shema Herve	herves@hcsolutions.rw	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.229376+02	2026-03-04 12:47:47.229376+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20844989	\N	5
6	Munyakabuga Innocent	innocentm@hcsolutions.rw	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.236811+02	2026-03-04 12:47:47.236811+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20796772	\N	5
7	Shyaka J.pierre	jeanpierres@hcsolutions.rw	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.247738+02	2026-03-04 12:47:47.247738+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20796764	\N	5
8	Mutabaruka Vedaste	vedastem@hcsolutions.rw	\N	Employee	ACTIVE	\N	\N	2026-03-04 12:47:47.252646+02	2026-03-04 12:47:47.252646+02	1	\N	\N	\N	\N	t	f	\N	\N	t	19767108	\N	5
9	Claudette  Gikundiro	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 15:18:40.847292+02	2026-03-04 15:18:40.847292+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655126 Q	\N	5
10	Ndayambaje	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 15:18:41.828361+02	2026-03-04 15:18:41.828361+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655106 C	\N	5
11	Ingabire Francine	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 15:18:41.832363+02	2026-03-04 15:18:41.832363+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655077 A	\N	5
12	Benimana Jean Felix	\N	\N	Employee	ACTIVE	\N	\N	2026-03-04 15:18:41.835563+02	2026-03-04 15:18:41.835563+02	1	\N	\N	\N	\N	t	f	\N	\N	t	20655059 C	\N	5
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.notifications (notification_id, user_id, type, title, message, batch_id, is_read, created_at, read_at, action_url, priority, user_type) FROM stdin;
59	1	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for March 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-03 23:39:46.213855	\N	/hr-review	HIGH	user
60	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for March 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-03 23:39:46.213855	\N	/hr-review	HIGH	user
68	1	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for ineza (April 2026). You can view it in the Review Queue under Individual Salary Records.	\N	f	2026-03-04 10:24:06.783026	\N	/hr-review	NORMAL	user
69	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for ineza (April 2026). You can view it in the Review Queue under Individual Salary Records.	\N	f	2026-03-04 10:24:06.783026	\N	/hr-review	NORMAL	user
7	1	PAYROLL_SUBMITTED	New Payroll Submitted for Review	A new payroll batch "Client — March 2026" for March 2026 has been submitted and requires your review.	2	f	2026-03-04 12:18:49.117099	\N	/hr-review	HIGH	user
8	3	PAYROLL_SUBMITTED	New Payroll Submitted for Review	A new payroll batch "Client — March 2026" for March 2026 has been submitted and requires your review.	2	f	2026-03-04 12:18:49.117099	\N	/hr-review	HIGH	user
61	1	PAYROLL_SUBMITTED	New Payroll Submitted for Review	A new payroll batch "Client — March 2026" for March 2026 has been submitted and requires your review.	1	f	2026-03-03 23:59:37.317244	\N	/hr-review	HIGH	user
62	3	PAYROLL_SUBMITTED	New Payroll Submitted for Review	A new payroll batch "Client — March 2026" for March 2026 has been submitted and requires your review.	1	f	2026-03-03 23:59:37.317244	\N	/hr-review	HIGH	user
1	1	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for March 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-04 11:20:08.244647	\N	/hr-review	HIGH	user
2	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for March 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-04 11:20:08.244647	\N	/hr-review	HIGH	user
58	2	PAYROLL_HR_APPROVED	✅ Salary Approved — John Doe	hr@hcsolutions.com has approved the salary for John Doe (Sun Mar 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-03-02 15:46:22.838087	\N	/hr-review	NORMAL	user
57	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Jane Smith	hr@hcsolutions.com has approved the salary for Jane Smith (Sun Mar 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-03-02 15:46:18.78789	\N	/hr-review	NORMAL	user
63	4	PAYROLL_HR_APPROVED	Payroll Awaiting Final Approval	Payroll batch "Unassigned — March 2026" for March 2026 has been approved by HR (undefined) and requires your final approval.	1	f	2026-03-04 00:08:20.786136	\N	/md-approval	HIGH	user
64	2	PAYROLL_HR_APPROVED	Payroll Verified by HR	The payroll for Unassigned — March 2026 has been verified by HR and is now with the Managing Director for final approval.	1	f	2026-03-04 00:08:24.04853	\N	\N	NORMAL	user
3	1	PAYROLL_SUBMITTED	New Payroll Submitted for Review	A new payroll batch "Client — March 2026" for March 2026 has been submitted and requires your review.	1	f	2026-03-04 11:21:12.147351	\N	/hr-review	HIGH	user
56	2	PAYROLL_HR_APPROVED	✅ Salary Approved — ALVIN	hr@hcsolutions.com has approved the salary for ALVIN (Sun Mar 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-03-02 15:46:13.536339	\N	/hr-review	NORMAL	user
55	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Alex	hr@hcsolutions.com has approved the salary for Alex (Sun Mar 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-03-02 15:45:59.658745	\N	/hr-review	NORMAL	user
50	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Olivier	hr@hcsolutions.com has approved the salary for Olivier (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-27 20:12:49.296704	\N	/hr-review	NORMAL	user
49	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Gwiza	hr@hcsolutions.com has approved the salary for Gwiza (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-27 20:12:43.677349	\N	/hr-review	NORMAL	user
39	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Ndayambaje	hr@hcsolutions.com has approved the salary for Ndayambaje (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-26 15:00:26.935469	\N	/hr-review	NORMAL	user
38	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Herve	hr@hcsolutions.com has approved the salary for Herve (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-26 15:00:23.146297	\N	/hr-review	NORMAL	user
37	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Claudette 	hr@hcsolutions.com has approved the salary for Claudette  (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-26 15:00:16.844895	\N	/hr-review	NORMAL	user
35	2	PAYROLL_HR_APPROVED	✅ Salary Approved — patrick	hr@hcsolutions.com has approved the salary for patrick (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	t	2026-02-26 14:40:07.081745	2026-02-26 14:40:49.755964	/hr-review	NORMAL	user
31	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-26 14:20:01.190308	\N	/hr-review	NORMAL	user
30	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-26 14:09:44.750922	\N	/hr-review	NORMAL	user
28	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-26 13:36:20.425055	\N	/hr-review	NORMAL	user
27	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	t	2026-02-25 22:23:05.202832	2026-02-26 13:00:39.035848	/hr-review	NORMAL	user
26	2	PAYROLL_HR_APPROVED	✅ Salary Approved — tysha	hr@hcsolutions.com has approved the salary for tysha (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-25 17:52:51.345381	\N	/reports	NORMAL	user
25	2	PAYROLL_HR_APPROVED	✅ Salary Approved — Jane Smith	hr@hcsolutions.com has approved the salary for Jane Smith (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-25 17:52:47.097267	\N	/reports	NORMAL	user
24	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-25 17:52:44.906816	\N	/reports	NORMAL	user
23	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	t	2026-02-25 17:39:14.61864	2026-02-25 17:39:57.630997	/reports	NORMAL	user
22	2	PAYROLL_HR_APPROVED	✅ Salary Approved — John Doe	hr@hcsolutions.com has approved the salary for John Doe (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-25 17:39:08.574201	\N	/reports	NORMAL	user
21	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-25 17:39:03.013694	\N	/reports	NORMAL	user
20	2	PAYROLL_HR_APPROVED	✅ Salary Approved — dody	hr@hcsolutions.com has approved the salary for dody (Sun Feb 01 2026 00:00:00 GMT+0200 (GMT+02:00)).	\N	f	2026-02-25 17:38:52.835495	\N	/reports	NORMAL	user
54	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for March 2026: All 2 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-02 15:34:57.824519	\N	/hr-review	HIGH	user
53	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for Alex (March 2026). You can view it in the Review Queue under Individual Salary Records.	\N	f	2026-03-02 15:30:06.045538	\N	/hr-review	NORMAL	user
48	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for Olivier (February 2026). You can view it in the Review Queue under Individual Salary Records.	\N	f	2026-02-27 20:07:26.709775	\N	/hr-review	NORMAL	user
45	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for Gwiza (February 2026). You can view it in the Review Queue under Individual Salary Records.	\N	f	2026-02-27 20:02:41.442311	\N	/hr-review	NORMAL	user
42	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for ALVIN (March 2026). You can view it in the Review Queue under Individual Salary Records.	\N	f	2026-02-27 20:01:54.887536	\N	/hr-review	NORMAL	user
36	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for February 2026: All 3 records processed successfully. Please review the calculations before approving.	\N	f	2026-02-26 14:53:47.015675	\N	/hr-review	HIGH	user
34	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for patrick (February 2026). You can view it in the Review Queue under Individual Salary Records.	\N	t	2026-02-26 14:39:06.339997	2026-02-26 14:39:43.124355	/hr-review	NORMAL	user
19	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for February 2026: All 2 records processed successfully. Please review the calculations before approving.	\N	t	2026-02-25 17:26:54.568479	2026-02-25 17:39:29.028558	/hr-review	HIGH	user
18	3	PAYROLL_SUBMITTED	📊 Salary Computed — Available for Review	finance@hcsolutions.com has computed the salary for dody (February 2026). You can view it in the Review Queue under Individual Salary Records.	\N	t	2026-02-25 15:21:16.344188	2026-02-25 15:22:51.55983	/hr-review	NORMAL	user
4	3	PAYROLL_SUBMITTED	New Payroll Submitted for Review	A new payroll batch "Client — March 2026" for March 2026 has been submitted and requires your review.	1	f	2026-03-04 11:21:12.147351	\N	/hr-review	HIGH	user
15	3	PAYROLL_SUBMITTED	📊 Salary Computed — FYI	finance@hcsolutions.com has computed the salary for tysha (February 2026). It will be included in an upcoming payroll batch submitted for your review.	\N	t	2026-02-25 14:55:41.533813	2026-02-25 14:56:09.593718	/reports	NORMAL	user
12	3	PAYROLL_SUBMITTED	📊 Salary Computed – Awaiting Your Review	finance@hcsolutions.com has computed the salary for Tysha  (February 2026). Please verify the calculations before it is added to a payroll batch.	\N	t	2026-02-25 14:25:08.469984	2026-02-25 14:26:10.222268	/reports	NORMAL	user
9	3	PAYROLL_SUBMITTED	📊 Salary Computed – Awaiting Your Review	finance@hcsolutions.com has computed the salary for tuza (February 2026). Please verify the calculations before it is added to a payroll batch.	\N	t	2026-02-25 00:29:47.035545	2026-02-25 00:30:46.64042	/hr/salaries/37	NORMAL	user
65	2	PAYROLL_MD_APPROVED	Payroll Approved — Ready to Process	The payroll for Unassigned — March 2026 has been fully approved by the MD. You can now send to bank and distribute payslips.	1	f	2026-03-04 00:19:39.524467	\N	/payroll-periods	HIGH	user
5	1	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	hr@hcsolutions.com completed a bulk salary upload for March 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-04 12:13:40.109392	\N	/hr-review	HIGH	user
6	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	hr@hcsolutions.com completed a bulk salary upload for March 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-04 12:13:40.109392	\N	/hr-review	HIGH	user
70	1	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for April 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-04 15:18:41.888132	\N	/hr-review	HIGH	user
71	3	PAYROLL_SUBMITTED	📋 Bulk Payroll Upload – Ready for Review	finance@hcsolutions.com completed a bulk salary upload for April 2026: All 8 records processed successfully. Please review the calculations before approving.	\N	f	2026-03-04 15:18:41.888132	\N	/hr-review	HIGH	user
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.payroll_periods (period_id, client_id, period_month, period_year, status, submitted_by, submitted_at, hr_reviewed_by, hr_reviewed_at, hr_comments, md_reviewed_by, md_reviewed_at, md_comments, sent_to_bank_by, sent_to_bank_at, created_at, updated_at) FROM stdin;
1	5	3	2026	MD_APPROVED	2	2026-03-04 13:05:39.106774+02	3	2026-03-04 13:08:30.355584+02		4	2026-03-04 13:24:57.405373+02	MD final approval	\N	\N	2026-03-04 13:05:39.106774+02	2026-03-04 13:24:57.405373+02
\.


--
-- Data for Name: salaries; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.salaries (salary_id, employee_id, pay_period, pay_frequency, basic_salary_enc, transport_allow_enc, housing_allow_enc, variable_allow_enc, performance_allow_enc, gross_salary, rssb_pension, rssb_maternity, rama_insurance, paye, net_paid_enc, total_employer_contrib, created_by, created_at, encryption_version, advance_amount, include_medical, payroll_snapshot_enc, hr_status, hr_comment, hr_reviewed_at, hr_reviewed_by, updated_at, period_id, md_status, md_comment, md_reviewed_at, md_reviewed_by) FROM stdin;
2	2	2026-03-01	monthly	\\x704854415475727375787a776469625045644a6e393361704a73357671636e4947676c4c6a426b65636f6b43543673375744593d	\\x4671654e4b686f4d2f4e4e4d656232313434706c46424a42667763792f574f6759745a47346e414146313338	\\x52316a306e446947563250716c78352f72462f39554244635642516b6b482f31316c3069667757416743396d	\\x776c497531696f4a7339486373762f7052595267502b4f6f4d7a45543738384e4a69673430614e4a6270666c	\\x61693576473746335a655954634150476d374d4355776459616c546765725a6c48596f6f46744a6955396a6b43627943	107479.00	6448.74	310.78	0.00	5495.80	\\x5053556e3156383963326e526d30555a37764c2f653533723154307673526c32626a5776484331564f37342f30385a34475564472b7144386670374c55466b722f413d3d	8831.40	2	2026-03-04 12:47:47.210787+02	1	0.00	t	t+2F6MdWZdbFOm3n05oNsX6DgbEZOR1DDiJHZPqsR4sFTi+wwe774LrL6AsNbwBpyz4wDbAK638kAtu1Jtrq2tLyM+xa2USGWMdoFb3xh0ul/yqsVEFjP/dJqeE7kk7ZbHtqhOfK7I+0kff6vsfNVZ0FqlysCViHk++By+vEX2gJIvMcDd8crTEHwIbFjUnM9/RweTh7R9qzytkOWLCQH5XVrDyExFEj23GA9/M9fn86fS2rCKzxzHURZyOPc+sYMlofS0YRCHOirdsDP+X3ZZaibeCzsf4ejaOYek1tL0+kVsminu7IVbPa0Ns0p5lFcUCupKs9d7PGIAJ+XoRTwofsIhm2tnQ01T/1taw5qqf/xuKrWVaks7CZ7abAn2BxYboXLbZrNp6UmvQE9+8tunVbCoaBrN0q6cVeJesy1H2NjxbVDQAEIyPwTflV0VMnDmk0sc7gNzMRthvrqWYWOMDu8cfv2x2HVoXom/WXJOLit3JywZ7J/m0FWdk4K6MSmsCt8zYLk3nbQDATUM/dzPTeqSqzcKWVmtIzGn/zc9rNmoZNyPrIDRb0yqTRwVCE0Kum0/Ct/ehrURqKk5TPn7f5i3H+HTYZP1A0/egIQIresc4g4KhsL1AxI+hNDTvfUcbmaLugaCiCDOXHNQJKB/tlMrIAvtxkkqZ2jc5fZqTisvn+bWSsibWT3aLbNS36GLw8gVEUHkuMfa+JObM6r6ylpARpQ1YGeg9oHs7+N+AQdHOcEz+cOYajjkl/UQeVesEJBS/x6grRrURJGTsQ9Dv+6gB3i/QxVG41KrSQFTAuWZOhAa32lwpw34iaGN/EsHTB7d4Yv/R69ThQsBz0CROLcYjDPcn8cSnDyDo8mY2c14GUwazCIs6XFmjyHgKZat5KT9ZPGQ4mRbbAok5NbKPgNbd4Jh3HVwKLzlCltTbn+8Fcn7enPxiGwWU5BfWLhIktWmBtKPifcFO/5jaB6U47zfZtTPrqMy9uYYtEHRNtAaGMPV126RMJKLoKRFnTzypVeaTNj3bWv96PIKQQn70lzTfXCniRyWjKrUnv6F6ysBU/4/xvGJyMJFw/TlKK	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
1	1	2026-03-01	monthly	\\x3754695848507a6f62467634732f68394c37734c7a6d575663743346732f307164754679544b796e6f4b6e573632484d67773d3d	\\x3475423261526231794c67496a456f4957304d34746b4670716464474b416f425554573974353959594f6667	\\x4e786c513779757866564761472f2b656a2f556d53364f47313169496354496d4451596d647953314f663546	\\x5143577655686b36444971774758517442484b585731507166626a7a35646a762b3048584473467676794f46	\\x364c7631372f6a30723570346c7535732f793135416e57383872386a766d32514851392f322b382b4f4f587967576a65	85425.00	5125.50	247.01	0.00	2542.50	\\x53794e47474a4f59764f75734b4f4779566d416d356d3251716f4d775835504c506e7556627a5a2b52724465613143476f34784a525975577238303d	7019.25	2	2026-03-04 12:47:47.196528+02	1	0.00	t	/dL1PWsKoQ8jUhfQxrEiIBzddoc8ZXvCaoN5UoWPoG+Zz/W4H+s/HrsGbzYT5U5tpd0OcGTH9IO5GzyVLGy9G7c6SQc/3L3qhEBIRLanrREtndbODl+QZVyJ2C1lgurgBLxKLnDJPUCGU6jzQBJNXDzPi/qGIQaLsKfd9XZzYkV9v376zHbfhcaiu5lJQaUYTzT+qrxOQXYSAycJre2V0Vz3qFrmSWsGewGecynXKjSPdBoWD2RI3DEHl8z5OPJDBXx++dmFVP1H933hVFSKkSeB+rsxuGqghqenKBe7Ugz/84kUU1DBdtfFFE8l0RugJUUheDlOR6R2lJ5W9i/RbyNnvGSkueM35XNY5oigOUIHBz8tnG9S8j509ySNbchHZjUoXw8sUCe62UvMACL5BfFrIXpdrR89oft5B0Hf3cYc2hn3yuf+TREuE8G9YnQYjSdeboEoh++FNwAjOo4/Lnn4PRd+EZ91/9oXmrSMFV5idLfyXWbTRxpNunRe3IgtK2NbBX8XTBU//SH1loQnunMcfjmgTVsWtPEq4m4PWusvRd3G0SRE9t92EavS0SnEifuOzR7vnW7E/bVVZLI60HSTWO7koJbVanklvN50pV5phKgeoSV+Sxp24UmE7j2e22Kgx4RGAuhh1DVxhYCLo6Yls7POv8aO8d/p+70j5Ooh3ECAn9ntwFfQLB4VGtbDOH7nERiHWzrIK69SvJUqCmI36qJgxXbSgb9NwFQFoisM8t0b3hUcP98AhJSKfc7UAkamow/WWYpsLmoMLRf7E5BoHiqR33yGOA1j4M8JgpQtiG4G4NIfwXbEVIvhwydM0gijmOQKQ74zaVq3fvyMi84GKTtjoWzmRd9cZ8SyeKaFDOrwQ5mi/oz/5pouPDuYgGHr7cGl1iWTp58RezVStdfWkQXnmNSFIfG0MHw8GnKZcM4cRYPdIE7vhq6Jc/IYjSwmC23GwLjSVKj92qaq4S1R3QyrjlH439Ma/+NxlMlx1BD7Tb5sF7Gxj//O5oLa4gxdMIJr+M76miaUvz9n2rtte3w=	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
8	8	2026-03-01	monthly	\\x5a72424573634e4f62656b6432385a7a78613243434876423161354c6b6a6337674c53637736476c6d76326b386154466f4d303d	\\x3463356366343257344b447375786d72307a41455062454e7045546556694c674b626c776d687077334c306e33424f36646d4d3d	\\x635676364237636d346f4a624157344c64756548614778515575766a376463434455432f575257615837704f	\\x30504851584266757536684e38654a504d4442794c48397838524b41686f425434766845595763357833514c	\\x4143496345306b3644764c436e766b336e4a4c313453797465727772593835774a4b4e4b64576a5a414a6579	1307828.00	78469.68	2839.94	0.00	356348.40	\\x7731366e416b516d31503831744461584a7766626d3362677642716e6c6b312b68657a685a6e4d584c704a646856714831504c6e5878534e49703935714c6c436d673d3d	100242.58	2	2026-03-04 12:47:47.257242+02	1	0.00	t	8JesqDJaF1Qexq3KnPQ4sM3f1fQTbxCXbSj3fCJQ8WVAppL0YgqjTBR7nHNyShRA6KNgPBrOJjECeSdpI8kooZL5l92ayF0/f3pCIk4OARtMT/Zvu3refW8fWXnaotbX9FSZmMmhpVQqTzYf+kRReI/KaSTZJAskYcexSrLCIjgwNQljdGj5wqeBSWvTz6Ezrb7NsnRR/ObT1yJYSjuY86Q7RPZK4lc8JdTytnFxNDf4pE5lk3cP/HADsMBfP0cEgfYBbltybl0iIQOSWDky73M1JzjJsyo0YFfkpHPoeDkMH/oKZOlFJOSdscKDm2WsyhpojucKzpqMc+CpEW5HitLzdeDX1QoJZMI+VbGR+nsMrzrwBRmGExFO34+lBTlsHus2Zq0JbcIwNhhnN+i9keMm9YwR2mSO4mfj9MMbjfNfvVxFu8I1vuIMMeyyJm9ljk1nNvSmqVNCbb+dHFq4CEtgAf5r/AOKwzw0dGCQxScyyZt4kihqwMEXjFz3XNnYby1ub5C5vdoVBuWI7Gz7Qn8ubSVjrIY3UkR2vbi4XX/hrVIx7YQddPkZJGns3K+tpLtUC/2DATQvd6dRmt8NDUkYwUEtlRrGezVRHkGftSWgReYPtVhJktrR/X21X7V5aEb8Anwx5btIgwIPyYeIV2HJdN98G9PIM9kLJL6JXWcSZyju0/ZfJAEJ2s0nyc18UrJkFC6areWrUKXzl5DA4KYwzx+baAK0853NY9mINohHz/MIBzyuYfK8f1cPPqswaiLa6NgQvR51Id3BxJ19simEVVSW9MX/8fAU5SjLM64EOJ8R7yWCq4l8Bdy+2RhkB143Gb7rs3zEBA7JzWdAeUH8Zxapxeqvpj3lWnbDv48u8FupUTdcD4fm0UClvL1qPQWKh8VYfHAUoOKf7n7/IuwlRf4tQ0rDoPkgUkAYgHnKGsPde/j2/JHRwntiqDaASDCOaUhPS6gG18c7nT5JAPmR/rjg+xoAp/hcFJqLr+ovVNYEl2Qldc9w2ryX/2ZXuNYILsw9Owl9RH0A0jZwF5TjbsVCubIS5Pk97tQgAc6zdd4rQKgKyRgw1hRP070wCymkHI0RD+XWJ34vO4BCR6pKCLH8fNrEBSDLzcMlpDc=	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
7	7	2026-03-01	monthly	\\x425947436f6866437549694c7369545a7a415a506e592b324b43533979456d2f3230336c7250776d686d6c485876436c354f453d	\\x3079666859423377695773562f756364727a774a65326a69586e2f39353364424a4e45644e546944746653634c376b4f6f45633d	\\x675a705a44397151654448743971556b4150726d56446f69444d36647535795353732b46533054774d623763	\\x686b5169344f775a4249314a594f77397a5a79524f47426374346b55714970635750756d2f67626d69455066	\\x2b6c43696d436a2b74667a527a6e3257744d54326e446a75564866382b6c7a647a6734462b504436344e4971	1127826.00	67669.56	2832.29	0.00	302347.80	\\x53414150334c61376d6c75756977482b4a2b516c4c66575048654148334b463730496d503575624374536e505131514c4c68414f62385254656a574f324a44344d773d3d	89383.75	2	2026-03-04 12:47:47.250129+02	1	0.00	t	SBiAfdqlzkXDawkU416osGL3YkqqscIfV2V99j662nb+fTBnEyMB/4tG4ttN7y9vCl6DxlgVKKjtX+ni6Kh382XTQpC+fRsNP/xrw0WjCHkjFW9g49KbS4M9Lyag3FNVQsMjOd8uYk59EY2AuChHUH+zEg6nfJgkPZYOlyW/R29Mdp2506M01cIPZfh7nMmjOb7vW5RfvwWgDId656SlFqN/th2xB7aPI8/KVB17szBi3WMASaT7y+CeCa9si9zpx06RiOA15Ts85kJ6Ie0hvJ0jBzIxD8VnXtr/InhQwNoatPtCzKXFdzt6qYvyOpsIuT0zBDIqZ2A5WrcoiWkrfmTXuzid8TqQSf3Jz34Y+TTA65p7rtC3VDUX/TqAzLnDvyf8/TJ7tn6CfztyojbRzIdDcnbEEIpNi1bpGB4tuj9O3eYDUrsuJzreC7m25rlGlnjuASeIinIJ8/evcS0TuD1Ds79DUIWwOyHtr2d2wJ2aOnqLXue9quM41hAfA0aYbKYB7UaXgPsqbGiY0++TGN5QGaGG146je2Fx+ZEQX2rR5ZmpZXeSQMV+GXzzO44OfQJ2EV5uUktcpLIPc6KMk9e2iHDMwtx+VLPjYzzSEWNS6V7YKLxBt2WQv6fHC6/qa78TsD7Ruo6tpqOMajuL9XLHDTMRYgk1ghrIFhdOVZdOhUjPkaXzcZGGmMUMPxuFbXsRkLl7htLk9xco+PJ3hluyeUt7ieJ5HYcqIjVFU9GFk8vVYpw9YxyRaKTTd9ocXIhg5cxD7Na93SHR+fK3P8mZq6pI87DaQ9/46qjwjN1N6rmYaMaB5d7673gSZ02aMvo5G+HqwtJejafq0sR80/Kzg1U7keuVYl+oiILiGvjLqtLYOH0LOCYqJ8i/qlon/z5tdBstqQlo1Q7f5wLR/Qv9RQd8p7KDvFbTcOO2lSaQuMfCzv9/xOh9PP+tHt5D/TBbxkMFQpFqaVARAKo2mYsatF7Diw9s524FCpLe3OLmWuzaMHp133KmcJL5pfZfb2VIQKETdCnYwnPKssUb0c/tkO+o4v0QwFDJauiXNSJhRI1tl7cEfmUpgvwZgWTZZHwl+WuCHiRGueQHtXajrQ==	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
6	6	2026-03-01	monthly	\\x5645614d61446675776d66525a6c697438525a346541447438772b75667134562f6f714e533039534259592f673130586669453d	\\x487631737444376a644b756f66693768785775475678654a375437676c6b574455554f5a516e4144385174792b763976586e773d	\\x6e564436773654534e76634754636e414b5a7378592b504b6a552f36574634686c7548536873484751557143	\\x337762424745374241695a4c763153427a67392b704275324f472b5674655034734833586259386a4c4a6c62	\\x55516f55765245716a536e5548794a37673852463239613756446b494b37503230485a354f505a5133753155	1370643.00	82238.58	2839.94	0.00	375192.90	\\x6f664969326267624665473745534f726f5a456d716e763975773359306f433471526a79662b2f4b726d46637944492f3077504c446f5558655054487459624647773d3d	104011.48	2	2026-03-04 12:47:47.24366+02	1	0.00	t	vcmRy2ODuJpf5uHpBpRPE4kZ/5KcdnCawUlnCfG2N0T77FdLCMJ4EtDDH8HWh12lk6Ve5cAdmjsL3a+B16ePKDDY46T6Ym6m4sOT0nirCEWcCHjyZyl4CpPfVFDLJ79SxtLpmCB431VDYKjUITZxd59VcBOuWKCtvjAkdqTQ04V9Him/Nrpxw5xWsXtKU+3MnbYntgQksV2ofPd4vjw04A4uwH1TPP6SJdaUBfXvgKe8J6+nwzAPYCENmkpH8D4+wxv2sGx3+rqUsehFb0dCpwepQ8a1yvIMsJ9vuz/uvyK5JSoqjegP+USoHWIpG1nOg3nuKqmMLUl4j4LT9ViPzjJC5Vh1pcq79WtdYXAibvoKx4dvJ4ohXcP7Y605JGhrsNH1ze01M66m9J9AeO5359KwKsgGrTyvo3Ynk1VEI8RG2kh3Z4FuYlJBQanVCScw3bwuAgcBBaRCgi54DtrOdc/LgqZ6tnjcTzRM8+IeE50kg32bmO2FlUbeMfHMMF0EYnfqQzse4gT7vL7WyxwYruAOPYxLup+3eVWJ/GSg+Oh8HNLF9yZUllnwf6FuEIpl93XK0z15fkW02uVMdZfVpSxxp0nwPfd4HHdljLlVw0AX4jPc0Yl3k600cEOBk1mO8fE50/FWwUL6xFi+fMBuA52mPtfDpegcC4wHV1V6JxuMQoA04MxttYDf/C8YQaC46dc4EYg7VPUx6ZUhjgGb5+/OGhzS5exc5uCg/b515Op8MGd4u7Q6CdaOrt4/0X8VO995SwcupRvKb4AW3e0z0lBbFIOfBtYXQf4CIcAmdmWy07VNYuFmlUDjLRwxk4nqVtjvTiS3WeNrK/u8tz4tI/7ySbvwuJx7oBMtPbLSwrzftV0G6sMVLISTjpoF/zOsbRSxS0U/VFUFUyYFmRu/AUo021OX/IvKvRUNfVliohyCa+jfWWbIyTXo29bQPy49XrWLlrLpUdGjORTvpg9zXEa9d3yelLJTwn4y26G17+4if7dfpsQD/+uHDYnXB1z/aE/1dBPdaDRM4nh0UBS9AoHvwk9jn5hEnG17nsYErdrFk9JpQUr2xrySvH9jm43WqHfuH5lEyAgBIogaoeGf38/qMRxpdydxNbI6	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
5	5	2026-03-01	monthly	\\x63574131555071794d427a52366c346b4c2f4163466f304572634a6a57794674684678444c47644a6b304430715a4d4d6a694d3d	\\x674a79517458494e44346e554a58354a3067385343307146643248716c466853772f2f41614f63597954526d5830746b6655673d	\\x7a4463714e4e7052577065532b356e66497735342b774b77644f504535556f76617439315135383446357a63	\\x5143585253676e4c47727448456c667353733539684f686e395a69733674776759337439345032372f497566	\\x3232647a74785952474c72335678617a7677774d6e39534b7370616c715346644434376a69596a4b51316454	852144.00	51128.64	1748.49	0.00	219643.20	\\x6f49704d2b6969542f346b5464326b507448666765537a47566c5975676e5458462b755765774c7a66794f4b3576366d4257684f4b7556533645762f3039722f46513d3d	64533.71	2	2026-03-04 12:47:47.232925+02	1	0.00	t	Ob1tHJMd65dTCb4Mzr/rPkQYdU6qoQbxQaAq34JiRhdh1/E4hLesh9M58jNj0lfbZL5ALa0CCLNGyWwGf648Q6e0NmK5Wm9MRyv6o/zalE2W9PIKZbi3vUrNDbx5qamQdbRalCHTzamL/tnQyQyk9I6a1xKPPWMmKoNcuLdqhBCW/tYMXMD+BMG/Rq9freJ72lBO/RFJgyAAXakBDOHVTBCHZhbGcSdyjCQmE8PFj+Bv4E/qBDYu440jxCzhiXbrGEvAY0AiyUrBfQphdguXK6G8ehZxxgnFGTQ2sj1/IotYc8XWOFJm1b3gom8j0bADgX3pXOCqlcEmzxsxoNM8rDa+QwMhLB3bMzpgnYXm3TZ9ma/uStbgwzZm8qB5qbtHZO7BQfjNoIYSNxnkNtfI6liB47T9SzpP0le5CfuQ5pBANz/+TpGZLMAb5KpmIGpMiFeqKM3PqFlgsS4th8yrs26ChlgQhsTU59mW/TztldVEji1MLDFtK762TPtW5aiI6YjNgPVYcnlz6Yh8d2q7guTH7Xs1EmHRr8AkvHhgQSktGulI6oJNlwN41r1T4hWI08Kk2ETbAz/eNf0Aog4CkfP5fMJebZb09Y8hUP0vDUGXnSo/KzgC9z5kLFgAHV0CxISSvL+lNE9XeC07LoP6R3nMJST+EeiHCKMDfwPkc43gTTdokio5gLXoyq6ek4GzNJMTGoOtk3DtEVr2Be/8kRVVoUIEfwoZFgsPzWgcsCotoSi0C9hk4tiazsL1oTSKKf3zuIe0hBUd2tscPe0PpSpRFeQ0eKsk0TzT9mEA722H/aiEc0hGh7wkrBbKpI+USOtWhERtY62QMlftr3a+y3dSg7YhBQx4q2msEd/MOX9Oqhrv9/+XysqQtoP56s3L7xB8i35iXl0vTal8jRbh8g3W+Ji9PSOn810TnwhPgUeC8lGvLSuojAF+fO7R8e9jPezH2cwAQQTOeaZdUuD3HzwR/MVQWLtg9Ero2B8GA5+QqqX0wKSu5NE9iO64IpF+cnPhVPpSsY5RilQCCc2oQ1Ruc/a7mJFbUz/d3RJqbDgkUIDSLmVkgCSHTExkBiOsYt3US26K2tbnm+YFRzRivkxmCQ9Yiyk=	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
4	4	2026-03-01	monthly	\\x694245674264704d71356944457641766177624e506b704564562b4e74787a2b76356867644c7065583943566b394971635a383d	\\x704b4d783958455a70346d4c52525643637164454e6671666279414d2b6872666f316a4b3452586937534a44	\\x55327768706131653036322b776950636a315749706e79364b44455546304f51745937493564335635323966	\\x6f56536d793343516d786b4a69552b3850543351486b486f41566d3247596465754372417a67476d554d6c32	\\x6150686974746d3133675958556b663133357835427364385745746e6b356c444f77374b78474e786141622b6f466e4b	107479.00	6448.74	310.78	0.00	5495.80	\\x452f55646139463373484c65354b4367586f5776354f58664c69585a75382b6555354d336d5555737748576c484e6b50624864386b4177364543704b6a73656a69513d3d	8831.40	2	2026-03-04 12:47:47.220201+02	1	0.00	t	aifvf+2ocNVFCw8EofgAGHGITB1KJ6063yMHwVf3GWoQMRzPH5MUUVUGBPj80q/GkEbz8qpwcYOkDqmBpP8b118Cs56e5bIJUJl0kMfZ6L5wrZpqmOkzO2VzScIgs0XKPqCPm4sNU3KGJvxDxIoOi7nfvtkPC3qc8u5dFpQYWi+9NmqD7ZMCHcFsyyBrrHiNMwgVKLenRDYwXhmkzrYSdi0oObpMr88cmoM0GER9QfsEFOmgSkAWZUIn0bOHASzNx8ePSWAcjuL6CnnnvBBAdcdfTO1qs3q/mk2RWURkg7EHM2dAggVlWPTdzumZeAcQF3zGGRDiXu+vddbycAY3aRpJgEXtxMuT7DdICQ0t+vVo9p3qaRX2YMU0XkS3+x7rQRPD+Sa0udTnW6yBVKqv4CiT8W/3Ma4/5dG8EPWpoztrI9tuf1ywWvuZActJcWHmfbvcJgBaE+c+UFfOyzWPU1G0wgA12KqY2YwP+jXmFbQb5OYsxHPpzFjY2VZ3SywaBDbHeehyFbXIH5hTwwVRkYnmBy8Hu+4GanBcHlTCOWmSImkNI6f548nkdrNvA2KthZaNnZplZ6azMqgn0zlc88o5sx/53989Nu9+ZeBt3BL1aqCnDGjVbijAbxAXq6Y4sqsbeQE6eLFQLo3jGuEeBr14BcG/S3BVLxibgfaDmmvJpzis5eYpKUJvVtrYKXo/sSnTivHgO9P58OG4eYt+Om/35e3M3QJ2xKYAc2DAwc/Ill/nwIk74OAzi3K4dqlHDibKIKz83+gij2y+vS7g77IN7zqQu7h7Cn2zi6w82tRLGmjHBphtVoDc7yGWSNeUF+RVc496IeqTBzcjoMYOtvzhuHxIzSmgiFiilphCqw2k1sjIwDvlkTLxtc4uJ+JKQ1tJp3Nhtg/k0OJnjRkEiHlBiZH0fMNjzry7hMs9+CATquEanD8dQb5ku7T/SeMCubXWONC/+GDSdhokIZw5N9kcE+oeCInw50ySe9ZuUrMZ2bOfV8W2DPgikWBXfHuxUenCDdnd4S9sgOoxeqkuP21moT+1XlJDk+aBVNh9DpV5ks5B5Wg1KDABC7EuUSRe	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
3	3	2026-03-01	monthly	\\x6746785353616b6e61565654726130446e63772b5746633849484261787672596f6b5674776346727875642b6b36375173673d3d	\\x48316679644f324643624171373548593863332b71384239415370684a59387869315a486a7331744879562f	\\x466c7a4e7232776454694e5a7075685a5534612b4a5847487644596e6a776b4e436e553842447a6e30536d2b	\\x396132764550754f46496178594144586651514a5377466d43546447344f777a454e5a35733277636e577834	\\x2f3566424c6a667158534372677650702b33394b395641767156324367684c314572527247396d627146644e36467941	90914.00	5454.84	247.01	0.00	3091.40	\\x3867504a625169694f4e4d435a314e4a596b4134317678636c4b715456436a712f686659314e7849416c6852564c4e795a742b454565456d58484755327473754f773d3d	7348.59	2	2026-03-04 12:47:47.216239+02	1	0.00	t	Og5iytPsIrs80mOlzg0qLPPS768yi9wRGupZ6pXiHIXOeGbb7HcBcA+F3XNEIJzI3SQxToO/ujhuzicGLZfL3547CnyU4AkePN1btt4+g8buNUnartaejhkROXcBzKzkqW5WA6UaMl+aGqdj0dW7wSw3ANuiUsRGB5YXyepLVJbDDCgHmNfXQbMFENhEL658kAFJLsGTN8PouC/tuRXk6VVOEVHuh+r4H+afFjf3Cxv5kHMqR39+QQuyhUAIge0H92K3M9399/jqp7JsixiphqDr0agCcpbekS90cyQd3d5U5akUp9alkh6D/v801CiBS8FdyFY2dyL9EeNTIu2qfnIjLDUAAfLJqOdwlNT7bZ3VhPRLEI6g+4lb8cr+gUp3W5WPJhi34Z76yxgbnZqe5Rsn8TrxNzdZCP8wHe/4gZk/xwGg+nghYdxr7z6CzpRMD+phZKBT9ZMG4fPeLbsmE9OrrQeQ/QACWCra5E1rENL+J/eC56ZQwMUhggyBS1nIk/tFiDCmetVGW/d8kcvwZb8XO999MUEgvGswDhiuVCM49D5lpFGityOXznVXhMBCOGF8xcqP60M7KjrTGw5B/wOEArlyLR6fyOmzyTa8ayjFs3YWN7yTL5boEQSyqMMStQUkNOv3KqzZ7lvRMvmSXdXFK2rIP7OzHECkE5pwQj6+lg9lrn3HRAnA3iVYGXLQQNmM3t8Te1Y/WAtflqB9yKS7ssT9QwMshPLv+JQavngpaNr42Y2wFjNXGhfgG+K3ch10EnH3b/WPa6sLb+9I0H5Wa/tlVs8PLzhvn0teyPUWW/nU7kCReoypnfnwSSSzDYeM/6zM0JkFm4XqRMkMz1rxsmd5xgnAR4ZHyGwBzL6P/qyYolYN6AuDYXWNqRzMMK5+W08lKca/BuDoED355A46h+R26znNo2ykkTThzPDRGZhK8I5i6gxXIHSSre54oIgpanQFdQWFlMdb33/IcraG2RJJRxr+/3dFLBvaf+JIpFhhna1MmfnqzNuIySPDnlWPBkOhXyPSXpTv9q1bBSo7zneUzwljlGq3QfqTOiUJLGovrFlsiJedsqI=	HR_APPROVED	\N	\N	\N	2026-03-04 15:16:57.801037+02	1	MD_APPROVED	\N	\N	\N
9	9	2026-04-01	monthly	\\x71655639684d4e434d72636a454e314d573031556949777651615439686733647135764f53483078696a73703831694d45413d3d	\\x4b702f545236784654464679656a6a44556f655a4633352b4e645073625a6756315a5a4778485032436a6b57	\\x48732f7a64494649512f49684651484c6c566d4d754b4a5170714b772f42382b506d72465a7139314f4b7652	\\x7571684d59724a595a7645355a373057345a6e58586b4c446e49625048672f454c645838446e6561734b6e41	\\x39446a2b55475873302f674a69765547393639514f63336e79626c51765344555249465a5a702b4969746d375a494b2b	85425.00	5125.50	247.01	0.00	2542.50	\\x574446686c694d786b494d32556d33306241634d68476c2f7046374b634b4e472f4c6b62505143777265676d446f45786c5331495131354365704d3d	7019.25	2	2026-03-04 15:18:41.815263+02	1	0.00	t	ps1c6WMqdo6PdYkHMpdaMt/NVkKRdntSB3q5+yT1pTabqnLIlIWh/k4td9m6QmIQMZhCdD6oR/12WJgP/WhXOjv8BQI6A3PN0QT7W9c0PNxSPo+BArU0epqHZqfGdBMtKo9iHBgfctLIIKPJTb49pUmFHSgVm0tFOLCcfW26IIvunMIwY4BFeiLn+mAt2uFrTBmJVDo2ScTRT+Cgyx0rlrVdY2bFqef+8/SpxRok9OgBcrB0zbHbN15PeB7iN1kH47Igq1b9KSZz8YSfJQTMPkP/CiU3ykxP3b4zEuZqZYOJya0sSIOkmOaiveJfZQUFNEFyX/XehpBc1TuePy+yNwekjPXHlSmSwIyFgCvdV3DqyFjKRRpagWofQOa0pzAOcgXzigPfhs5wf7964NSFp71iBYJtDK2LbEbvRuqGhBfKLxKqy7QmmE2QhBCTVpo4n5FGX+wAwpe0ICE8lAu0r4VKY1eq8g/ZGFHw6UJMSDSXWprk4MFCUH1wX6/upvzA1Yuti+dVy+6TeWLp+sd6/7HqO21X9vVoiIheUbB/KfPU7ZMOBTZZET3W16+n/MkbZRxQ3hyoln8b+sacRfKodC4yEueD2oBE5JHRCc3J92gm5lc2hqxkUaXflYCHPZjF8OCaaILlE27PahsIwJmNqUE+SZG5AMRGM/nEpIDejR43IvTO8GIMIq5yF1KG97yTWh3OLNuz9/TnGLjjfBJHuHDAOpucF7FWVBLD1enMaw1rX6Opm5I5WCqgSUqtxlP/JIpwjbZui3Vn6slbLZt3K50Sv6pa1YLECG/XMPnBLpbyJ5Mm8dInNQHUtgnM0A10rH6Z17PJ7DhAdnwhrb4IYp4/fuL3eMbILZM7EZUJcJUgEtI1+56puPkz7z3I96hronYU9GfP/P0/knQIb5Ivj2O9uV6qmY712Ybv2XzlknMkK7GJDFYePVgyk61qbkJwLMF7yLepVvUOpqg+eLTuo6B+9e67TaWUlB8W30UOH3axAaEt2XfYvFIDnmSrWx1DjgQSwIL9Ht2qz5zBcTXe4N6ZmR0=	PENDING	\N	\N	\N	2026-03-04 15:18:41.815263+02	\N	PENDING	\N	\N	\N
10	10	2026-04-01	monthly	\\x614b425458367638716648362f797a5a696c5976526d4e325a646f4a41434e6e465a6b337a4a474e4d7562357a45692f76316b3d	\\x6c32344468617542716a39626562344e7a59304b4e664961466432434b67755146786e5a45615771364e4253	\\x4a4e356a4e45673971796e46344a2f2f723270736e5048394a41306b6c6c5a64336a2f5157714f4755756a37	\\x6f624e6b4c3338414a2b3932465174654e7a354c593974766762314357657977334164387161704a68534170	\\x566d396377662b6d3839765a4373724e783974714934485746446267726b3339724e66565467554379772f2b62464977	107479.00	6448.74	310.78	0.00	5495.80	\\x70576f73434a7171666c6b4d5071536e62705639496a31527253523551716d6e547832476b51436954557a7a52384d434c642f665968486d6b4d6b43726e793338513d3d	8831.40	2	2026-03-04 15:18:41.830439+02	1	0.00	t	aOKttUiIbLKu2TWgWKuX1t+TI6NVi9GkaGP9CqvbcAQz+tnyczTxuwyw7ClJvF7RuQCsjMP5nPlKiJBn3LnyokvqIT2ZfPoh950C6c2qCGsluIN62NAHNNLOGOugDKiq5/K9QFHBEYjK2XmxyyX1hCdib9G/ySVbS85MyF7ejjsmAihQPLZTBDAp4xMcjM/pd2mD1ZRbb2o2jxvpfes7iTB1zV2UlJX8c2BBtkX6UGlc8GxYXBh5ewuO3MaicnhkB2+IBQ2n96V6iyYZRWHj1Cpz2LTCpSuW8yqi9oB8OvhpaD91arb8o5CnSS0O5OLi2hN1nHO815gBfhxqKMTM+NUlH9jjFgGLZkCgep8WZCWrG6b9iXHNRWULDyRw08COxMHRe0mdVMsEqWiORT3uczp0HQUJk8iLMulC0pf6+B8b9pW5dExDm9KNUaQbhU+scaAQao9pn8KLSBncJGrh/f9f4xtNs6fVRRAi55ib4SGrrbZ9FEJN5xL2Jm01YJit5T40o/5YJODPSK8zBKAyyyaaTq8CVYOphchEuHfqI6hJx9Y6ecyPfBkTfvxG89E4ODh5mxCkcrHnUJoG1R3y2qEs72xe1mijpbFIDWd+t0IakNOQ/a/inANry/jMLPfez7mHqS9/OA/mGgoLEcM1n/xAod6osJ0asdS5NipHpg1riP2W1Ag8wYphfqv69Pr59ecAq3fXWW6Yyd/7H1aQeYIybwIJS7MXVrhSGqlnU5wUOM0KoOsLPXPDgwOnSWY3xF8D763SrXtIISNlOPYH4vR/8cTN0A+cCwoDNt16d1u2P9sFMsnw9FK1we48yCksoPz/qB34AbIwChOJwDLMz84HDP+sEy2SuyGOuLEwq8EKZ+DvVdz4WxPuKcANbSlP08wzx0OmkIL3k1FAmrVnYt3yB26NFYiWSwx/dRWrxdvQn+0qzlRR7+jLbFbI7KEgk6QEyk1lhVGMn6QI2/ZB3Dld4t1riEuTyyrzlCaJecSxB7sqrTCzTRiAn2sqn/l2lrMPVN7Akv8qU87Oy6EuQfsV+43/SVOthsE9JmOpLEGdLrpNfzEElfGI28iIMKY3	PENDING	\N	\N	\N	2026-03-04 15:18:41.830439+02	\N	PENDING	\N	\N	\N
11	11	2026-04-01	monthly	\\x6e5a2f454276782b796f6b703072672f4f55514873666f714a36785156456949626a373261644c4f4a7438316a796d466c773d3d	\\x6656323545456b5471687539562b7157774c6b4a37764c574d47376f48437339763439634854447033672f58	\\x345a5639333378414a5264355653594b354d2f5741736a4471584a393453796b646856534c2b586f4e593766	\\x737451594e62744e52477052754a57656a50417377666f66646b697175535465652b49534d4d783378616e31	\\x4144593141426c387179516d64496537505477384f454b6747464f692b4a696971565443664a7838764275657331592b	90914.00	5454.84	247.01	0.00	3091.40	\\x466f7343547059366749754f676b556757427a446c2b4f4d7658712f6162353145757846595661764561787355397a6b47502b6d502b303346454e6c4865502b4c513d3d	7348.59	2	2026-03-04 15:18:41.834369+02	1	0.00	t	Nm9Wz+QbHwlbZA9SB1DHr3ofYl9o+8Sjjl197f0QpYQu+lHIgplEG0ijj4Dfyuent2w8tEKDEbaDjU5Apb64rFGYk8oGAv/5uTV4F2V3mdate/q+ejWSQDMcLKkT48ugSC+BqBVN7AuWR8DFNaJzEvR+mNTKvPS9dTW6ZotOB6WjmBN1TUHw7cT/dbkWuaCMaGRNsTWaA3oCFXyZJIQaMN2jFL1GM6pop3GwS6XEXwTHgNsV4dIzJlQx2kFgxApn7FjknAwUY8FeVma+dbOfCNiBmJfPobaZOC6Et0VbTwD8yO0pQ3UL5nxGcesHy8SH0vRxbpZFEqPNe1sSxwTCufymOdMFc4pE47crRpq454GXsS1g6L3KSTQi8gdKyEJOTV3VW7XPcSm7FSeuus6SMODFWUL6YKjh6yZLwU29W2E1vxeC3m5VtozJj8RKVq8Re5Yj0OfGI1w5Kt6Ouynsjz5mfHDdEo1LVUcRREGAOIvwHL0mwljKwhiRgQ88TR6zjRAelLJ88If4S9AMK/8fcbw+LKqA5OAfiYldFdH0zj5+V7h/TxwABKXIwMrOi3tgynh/Ni6FJdSgRqFRY/go/coUPemKAjm+wfWgG6VJ0xv+SFMTuPNQP9wPTqsheg6JT0shi3lKdEpk4neFMP47oxS1Rbnn3LKr3sMWBYshAWaxJZBBTyUtkd6LW/EVz7LIrxo+IqwXWjm8Sv10AYWCDvDLtQTlXim2fqIVDLVboRmZz/PIvb3sOzJjSXifay7CDp9c39fnwUzibVttguuLsJB76AquAuziLvah7bELFdN0Z4LYqFymocfMGmu1C5jJR5/rQvsfc7b/xUWOBZEMoWfGXYFAgbhYmHt7cCkkscVlmAAIiw4D5MFC02U89KtRXxO5Y+ffEKwkTXF38Sm3/2OQQfmgg2l4t9gw0qPZsxUhlUUtVEG2i3lDYYdH3Lp5T0WhHCDyYuITYCyfnuFOohAbJesmMIntAtW/Slc9GoYkpQBr6QNcz1nE4KV+61Jti96SN6g4rCH3lccHnEOeee0L/7o2OM/vyfWXy6o+Tip3y5GeFaqABBc7JcE=	PENDING	\N	\N	\N	2026-03-04 15:18:41.834369+02	\N	PENDING	\N	\N	\N
12	12	2026-04-01	monthly	\\x3437634e674b785563707436343673653678746a53776f4a65376b764945536358307078496e462b702b39346f49386c676a303d	\\x67486f4a726b443651346e4d5079514645525a6756454568434c4c466470544b76674f2f43416a64687a7a74	\\x434a4659514979496d45556a494c476870436f58747661512f50346d723162506a79484a4357785339324335	\\x633851553769526d2f4d63642b724f50335447375031624d6e45515a4769394439622f5947344a6a46557742	\\x36494345682b6b503066787531795353684c77424c43512f6638774b765770626a50714e2f312f77446156576f514659	107479.00	6448.74	310.78	0.00	5495.80	\\x4374614e664267444a624b33556474457771324b68542b7a687539656130624b4a364766486938704a63744f52714141514536307a62726c552b574b675335354d413d3d	8831.40	2	2026-03-04 15:18:41.837113+02	1	0.00	t	FbxzIrKV9/oRErOe88gN/ivLeXCYKh9dx6k5rUsrtf5nw7qQsk+hBNZK1hN89uFFOySzq09s9azzt1IwhE/tB+IpjLphtgrqa9QCU8ZSg3cyGpe+tCaRREVV4L4Y14IYp48OPYTzZZpZmvD8qAmpPWHz+p+Qmf3cudOi6wEoLeJ75L/IpCA8pdiTJJyHWC3TxhCsOiIKhtE24amZytyZcMAUFsiy7NQTfAeSrnrVld1iRUC7aMwN4A/d4oo7gLfD/WCNMlT0gRgn3CQYJdcaLMwENnAZLGS5pTDR1YcvyBGi/ava3144kaWv9u2DabsyyZu1x64mSXub4an9nW77+k1gejEbD/ah3m5KozcI4Uty/8juHXEV7KVnpnCDDj57616e67K4Y6U5bixHU9icsYB3X02GBQV8apd9rOunbd2oyoBPMu27oi0WH3BY1fDurNZUeOBAgke3AK7QaB0QgGON+z+MwO9VwBtfmX7ZwrJ8FJjJydTDCjvj4VOL5thVLKv8UmxwpcwIiA0BZHiqgXFHKiLHa5QlPS/h34o1bJYj+fDFBnzZP3H5cCFSBdXQw5XgRpvUWohUs6TFnoyM6Zfs8SX8FkJNp6LK9dLFsKdQVoNFEkIHi+HG7Wh7SnBAwfYh2OX8k8+ZKAGXnpZ3Oy7oqIArPxOxMUI7hRcHXCrDn8doae9nRCXWy3MU6YZUidXpU8/hfcVTBnJW8NnHUYrzaIW9UFP7n70mlOfaXex60AdVY03Gl/dzORkSqhSe2sL6Gt5elGxhb5aEnFNfRi93yMQrgR5WFv5oR1ui0f69CzH2tDH3v6NSab+gWKoTgdud6u0Iddoe81Lhnuixoztz4gU9Xws5N35VKPg305qEZ5KpDohmkB+RmT2w6NejP3CmfW5xxwK5F2JftOmRj4Ru75WCzHO3dEspEbm5qQ8lvDkujAU6tKXtj9lf6U8GZa3DnCnb+FH2rTSCYQc8WZJODpFs0xyq7RFN7hEPr7SOM+94SYhvWr7aLBZ+GeJEvFm2R9decWYBkZKYU0pZBYJ0UgS3kars80BO7GlrEX+qwhfl/Wwru9HqAHYyJC/e	PENDING	\N	\N	\N	2026-03-04 15:18:41.837113+02	\N	PENDING	\N	\N	\N
13	5	2026-04-01	monthly	\\x344a34446f30484c5878634a4148704f692f585a65775a5773794647716337597455514158672f79495a5345364e786d6968343d	\\x5a63313952523870376f75314368773645686b3161586c6b712f59596267694c706f726241304878444a7066366748516d726f3d	\\x56415364436c564e304332355a514c325652596d506c715858785944782f4b47656f5348774f473878613641	\\x596e69786a62696b46484741414738376479474d6f424a4a7047485332435045476d463176693750394c4d4d	\\x496537587845786d6672684247696e516b6538716d3965374d316f6e7a754855626c53546c597a6d515a6346	852144.00	51128.64	1748.49	0.00	219643.20	\\x74614a4f756a35447634694f744931474a5873316a30475172714566673969437157664168655a72636875706f4834756f36485938747766424c6a4b694a416a47673d3d	64533.71	2	2026-03-04 15:18:41.842766+02	1	0.00	t	60TG53+s1/yQGyICUpKCGu6c5ZY6inLPoOVYDedGNVciFkBmWKsxEM+KEK5EXJ9h8KpUmyV1zq8r7lUpuJ0bf4OcrxnqLTZYqLjkGJsInAzGVF79LI8QzzqG5HTHaQ9vlfTu/s7LgWpdnT8XfPNvP1Wfx9V6Dle7Fg/N0JesaR5oAfiesTKvvh9LsFBmQUb1++FSHmP2Dd7os/dlzlvTZuNzqojc9KxXrcUav/sMPT8/QjZ1qopAykXYxzmsV15j4zuV1Y41iEOBcyA72CjF04itMaXad7Tzoz2N4ujwbV1sZuoWrG4scdX5OZOMlY5EOxg3ECA6c3y4dLpTX0GmXfNYhE12tkrXag45QflfSoXFM/3xzmeFZWMd23Z52KwxRCWKvuDKMA23huuVdiyInj0Iw7vvcAIuae2jUhiKe94FbduFZdmZfu66TlOsW+afcUr/5wmfZyIltUwQ/E0333jDfpI7sceLVXcLsqITtZs5mUi/bWq6Zcclj3zGgxnH7RzN3zmFwr6Bsw7T+GOY96DgOmS3FW0J8kzyiO6OsDPB3MSNXDQGX2LgfkeCymiAwBuNQLwmhi5myM5YzUCmERNwj5YqbKKExgAkMWHzRPgq1NGwQXeNkF5m2ougBV7AwxZI9PngacSacJcnRehC9x2Z/dz+fVXj0o6oJTQAsV4DqKEZA6ssHXj4N7Ym/ub4ZMh7VMlt+GjDH6By/nm9fT5LGxkffHQzvC9ywHyO6u7TIfBsG9qrU/rhMn+x6P6T0EW2Vw66KL1wTloINCzeOX2JqTrtKX0GtcDV/EeYj/mFnsjFRtdkHSxqopmVWj00LqnZXDSyG4pYkLTO19/dUdPRQ9N5us6ytuIwQULQAlUtWHKcXIjvEeFWpfeBIkG/DHi8IFEkRrGiyC2IA94VFRDQ4OZNeD625ZLPRMFMvEWtpX+naauLW/LgCpEOQpuw3w/3o+Nd+sv0JoJoqCxnEftsfoK3Qa1C3ZmkKt3UDDgPVNftDjGFQy+qpFalMJlFYJNdVPobtlNDB7E8tJTN36efe6mzfMth4WO7nIDCojKCXNH4n7Wpt/IVPhxfhrZyATmDBpjiHQ0RJFoXYdlBkDCOm5APfXw=	PENDING	\N	\N	\N	2026-03-04 15:18:41.842766+02	\N	PENDING	\N	\N	\N
14	6	2026-04-01	monthly	\\x66536a76344e6a6677447944336f4a6f45537957713750427966534e63486475392b754a74366a5069626a633158304e6d75733d	\\x70527132596463786969687a554635646f70334f53445954776948396d5178464567617864437646695239383143654f552b633d	\\x5747692f38785167704559384f4e347974774a4a7a455276425a69676c735448416b5233646c53497a697336	\\x304f44516d5a544b5a524f78434f76374a69455145675562626942476c776f737a7658714e594250775a3459	\\x7a5776474a306f46744d62573373536546514c704c5342374f5a382b41416d374662585365383369475a6869	1370643.00	82238.58	2839.94	0.00	375192.90	\\x6c704b61477a7a6d714863557a4c36384d674434764d61306456666b4659597045517a504a365a38637278564b304952674f492f736f755343422b705772797570673d3d	104011.48	2	2026-03-04 15:18:41.845698+02	1	0.00	t	+1jSY3aNH8ZuiusVK5lWApKawIpF2m0vJlfiCMSNE6CPSwuAN7eNugSV1mI2cicJdnT+V2NyduLcEI7Ykk1fDFuciy8L9qWm9BoWfgyB3Fj9yGAFjfacOfTd0m6CSYpkgUCjTSkvmn9yVPa0ZP2w+y6CMCGTRGKdrHjFUzVP9LDeV0OHziBUcsNguakEdUXIo2iAQsmyDDFZNpgLtMfQ+uWFOprnyo/RoHI1qtSYkG4n3aB8e7QIHUUr752ZQdMFP6pPlIjPnQ9pDxeQcqCH11wkt2HghpFS0Bxmc/QPgqR8Ku0Wm7138r6/fr9WYHtRd71YMg611ZlB5DHe4tS3fp8rhQHHUvrzavKQyXtjGCQy90O12gGZf6VcCGCemBDaOZ1TMbRRPix2XxdPkVtUiPe7LdtUicl+FwDHNmHzdxHwsLZBuwy5C8XkmLAPz+socKRBDPrSpzLW8mNiq019CDWN7WwEGmlzxWgWChugeJZ1SGeV/R+K/FQFXbUSpQb0zCD1QnI3HFB8odUWXnCYHOKw4VYFkVxinFmhJ2UrarKnKeLGQMqKB8MwHYthEuKyJ9BexhOz6jfHyzu8Ehqo73lf9HxGTOEE89jfyt1ZFqqy63f+EimYFa5Ab1QNstlxbGuW41lfM+IHPyo8TSxUignLsrklAeKhZikeOF31dHb0cmiyKYfprfuvlzeNz6bRzx0Cza2gsWagrX5NwG8/wbY6VBWb3vY6NRd0FXO0T10mbdkF8MS/oO9rwRTk4aOLQjUfy4kPxCUkMqUoQ1fBUMzQNGW8sx5E7j7PJiQ6aAijn+J4bdkuZBLCA5BvNuxuPx89GPvkSU7TKqvTDtX6zGuM4roRwJqSnWYU4oQFcad/+7RbKNlKGyAeF1z/fYRx1gPNA65Wya0/Lv2xRx7X3aebRXBVDSuHFnskqJg2qcl8p1PV2nL0bNKNXQI8qIKX3uTJGGsJ8nD6kETM0FmKXOJzXG1iNjw1Qy6BbydVnk2Sk3lgHGwzMT3S5Ipr9U/ZE+bm8shVi5f2y9STYLlmFnA8tG5lyZJW9ePOZvBNfuC1KBymewcxQZC6VsI0dK52Lkn7swro+UvDmdYkYYpZFN7X59/Bzaq/ZEqG	PENDING	\N	\N	\N	2026-03-04 15:18:41.845698+02	\N	PENDING	\N	\N	\N
15	7	2026-04-01	monthly	\\x574a6241614e7a703632525945456b486e573964377851515a504979394c67746d45444a762f35484f533951724149307a53413d	\\x54686273646b324c4a4a6d67334f646366343143686248756e784e65687a493170633655504e65765a2f75617677564a6675733d	\\x33656c6e4d614c74443257555a61374f5951387767417976692f6e774c2b6e44464b774c7946434775376b34	\\x7545614468494b394c59306a3154394f5237672b4c43422f426c2b385a693152646f6e324369414361314a41	\\x64354c5a45785a3038343071454f58334c6f47305a6e52757461626e784c4958645775664f5637646d664d46	1127826.00	67669.56	2832.29	0.00	302347.80	\\x5653644b5a5a4a39474337704638446954674e6f6c2f4b6c642b793467524b635a6f2b386854706a697a4636484c755466546d6530384b6d356656567547306955773d3d	89383.75	2	2026-03-04 15:18:41.848528+02	1	0.00	t	S/GONOGH8nS9+0aX6lcRHwboXNlcjz9B01XrvGypbOX8oJphYOI9LaIDUUjgmH+lWDDnqC0MtSWEMcq1XY3HTG0YSyXYfj0GEjiPDERiDygDkk6gxb5fleymtcC39QCfi1nr+y7NxC2VylP/gxuLChTjM3HQnDANg14ZRZy+ux84fgHud7VIBLv6ML3eEYrmCLWPdeHSl3cTCcPvXBVD6p9lHFuGX8fWXKQ6VmO1ORPZeccOGERmWc2DaIWBZaNJ6ZgjN9nw6cFK1um+XnZIU9Oc9iNhOSvhCv4pnLe7FF2AflDwCclKQ0e80VOSsbce5SLJMKvBlD95DrTKL7HAWQHaLfG2CEBpBUSaP4m2UB4Y4IUxRmAy6nsPPHK/TMZbIOMgAXGG5L5JZ6GdoqPMZUdoPe6dYobprQK2O7n71BjvDlbJxalOAyaeU3YfqmEzrGlSZUH8sZYRtQl8SIDfYj/ouqFDhsH1ruF28r9HZ915vPm0NEQqCdkcVAVYaiJEHTyGqKc3+wHCsGUvblKHIBiJlaVh8eUUqnPPvdZog5BSwUyTjt72I8DeepuN5aNltgwBV5f9HyATJ44vEYaHszW0Z63aYXHazbxga5579bTJWxaC7bbvIlqMLttaLBRICL6yBFyFowxXkMJko9xDJ+uWUtQLcsFKrUmAZSi6P5o801FZW+KxCKmNtkAYH83kn+mNOT70pcBg3LHLRO2TXpHAVanZPr3AOrWyhz27Ha86bZIUuLU8kZxVH2iCKeBw/fcF6RKWErRFXVWXo3SXzXd6rgJHpo7nRntM3STh35VAanSUnocUSXuoMN5AMfMlsBalFBPMr1IGOHo6Qr4ka/SxkR0pk8SwRahrj6kKYXRsHFUQfe9+B5mzNKcpRF9LULqTjFIULhPgE3dqb5p2CywxPOeOQ8N5avS+RDvE4bEJMMKWDfpj8nldVA4QNqmrlABzAZsksTMnjJAo8yReFz1MQmWiiPOKuydu96TNH4/hV+lgXMOTMmhcz2gts4SoWZsDkjtgiG89V1hefZxUW8BxhmT8Y5KWCSEphdCxkC+dDKg2965VdvoMidPvUszGbDXBTx7hFsJHlZnWTw6gEA==	PENDING	\N	\N	\N	2026-03-04 15:18:41.848528+02	\N	PENDING	\N	\N	\N
16	8	2026-04-01	monthly	\\x646a34786c75566365786c365055486b445757377343745a71482b686f4166586c51386b3632436a74395763494e514b316b733d	\\x5953712f31734a454e4445754b42537459537164333646627a33366c6c65666e546239585277735152573478486c473577596b3d	\\x3655456761446643662b6850496d382f774b4f3050374f483837336a6f3132334b3749465669725263575855	\\x4e4e7047355457304a6d4d6d39646154376c67356a50732f4636596f5a702f346748374a6c512f392b4c724a	\\x70396d6534764f624356577a7133765a6c6b6a4d5a513258796f6b64744f4c6a7952484f44492b2f664b482b	1307828.00	78469.68	2839.94	0.00	356348.40	\\x4a647249485038533032304c6d396b67633369707750594354626976704339444f4a766e476637386648336f565a2b35586149443070367245386732556372574f673d3d	100242.58	2	2026-03-04 15:18:41.850414+02	1	0.00	t	TUlgP8ZJ42KycHq5Sa4iFvlfMM52o/IsDoe5iQ9pi3/qaOaUtXQDZdaCrNzrkqordktYAu/j9bev2lez0fwWQkmP7h9N1hqB6ef1gAUtgLTtbuSd9aSZVSvZNLIxdO6ZmAt2FjLnDOLXftc6+vSSByS/epEfmvbHiQiGQrLHVx3pbNoEa/rfZsuxKiBH4wj9KYgX01VmfLAWRpVhCtLHuddEQihUI9ws5r/+aKZ+BCLh8FIGrplwHOzwjmkdWoDIXIcDDGkzzNAp0XaE3iM0MohAJ6HGR35B9kEhswWsTvMW/Ne4/+zPEEeO87Iq0CVuQyWOoWVzcS1RK/67LyG3oFPQLtB+IYJr5P9/rzGhOaAoTkqVIumhNQzIiQu1fGWFVE/ZjN+SImy+e8s1/ENtzcm91O3j8u8WoxypDHdoLjbDe7/pKnDQ4bUF9cPp9o2kbltlEiHi9hzj/e+A2qEyJnZB/xjja+rrDr892OiM69+cbpG4i8gxy8aq5hk11bLbDL5CChogJxMlgAUsmYxkHtuvIVKHmmNpmQJvGhMRY3SujXF6UlvxU1eEQ4/oxfo+K/zws2ZMfjV5zHYM+Vag0DnYlEspbxyGIsSeElPTkn9Q5nyNwEWNAju3p5KzuZ5z7g2nZ4WOOpiiPdNdzAWFt+mCuXV9qxRfe8YqN8wr20n7tBt10rRZnkEmF2w36MUXCh1OtTWqbos72tgg0ProS++1a7hFPIxz5hGWSLB+ZMCHdmSyGsc2CNW9EFb3t71fDjQXm3lBH3wsb0FCu/cfaVsXMHg8gYVZH/k3GS86m5/SWmF0lVNFtZget+iMn4hV5b2MzeutZSa0M2HzOACezo7J2UnknPl+twUgWbQocNMl8YBtgqq+bpPJQtpigX/Tn9s5uFSnF0ezWtrkqWS35EW7rnTkXTMHIlQqJMr7jz7qI7lQpOlrwVIhCCh4zqgABetnmTF53CJXl4pRFt+yhoo87fIgrTI3hqoFw9dbY+A+597CB94GRZWUldGWZwc/BwVLrJu+ju+6P7oE5qal2Oxzt8RwC2KAaJ+TDXci7KnmMBcRMnPKvIrx6UM/4191DgacP8n1kojPUjtNcuMd8toK+jCnSIJ1Z3MiA0uSRc8=	PENDING	\N	\N	\N	2026-03-04 15:18:41.850414+02	\N	PENDING	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: hpms_core; Owner: postgres
--

COPY hpms_core.users (user_id, full_name, email, password_hash, mfa_secret, role, department, status, mfa_enabled, created_at, updated_at) FROM stdin;
1	System Admin Test	sysadmin@hcsolutions.com	$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2	JBSWY3DPEHPK3PXP	HR	\N	ACTIVE	t	2025-11-28 15:33:23.656891+02	2025-11-29 20:10:36.639811+02
2	Finance Officer	finance@hcsolutions.com	$2b$12$IHWcXsbExLYyVCXsvxoZYuP7B.7PiBW800c0oZ14X7hxLTGaNde0S	PLACEHOLDER_MFA_SECRET_DISABLED	FinanceOfficer	Finance Department	ACTIVE	t	2026-02-10 13:19:41.941071+02	2026-02-10 13:19:41.941071+02
3	HR Manager	hr@hcsolutions.com	$2b$12$IHWcXsbExLYyVCXsvxoZYuP7B.7PiBW800c0oZ14X7hxLTGaNde0S	PLACEHOLDER_MFA_SECRET_DISABLED	HR	Human Resources	ACTIVE	t	2026-02-10 13:19:41.941071+02	2026-02-10 13:19:41.941071+02
4	Managing Director	md@hcsolutions.com	$2b$12$IHWcXsbExLYyVCXsvxoZYuP7B.7PiBW800c0oZ14X7hxLTGaNde0S	PLACEHOLDER_MFA_SECRET_DISABLED	ManagingDirector	Executive Office	ACTIVE	t	2026-02-10 13:19:41.941071+02	2026-02-10 13:19:41.941071+02
\.


--
-- Name: approval_history_history_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.approval_history_history_id_seq', 2, true);


--
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.audit_logs_audit_id_seq', 8, true);


--
-- Name: client_contracts_contract_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.client_contracts_contract_id_seq', 1, false);


--
-- Name: clients_client_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.clients_client_id_seq', 5, true);


--
-- Name: contract_templates_template_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.contract_templates_template_id_seq', 3, true);


--
-- Name: contracts_contract_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.contracts_contract_id_seq', 1, false);


--
-- Name: employees_employee_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.employees_employee_id_seq', 12, true);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.notifications_notification_id_seq', 71, true);


--
-- Name: payroll_periods_period_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.payroll_periods_period_id_seq', 1, true);


--
-- Name: salaries_salary_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.salaries_salary_id_seq', 16, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: hpms_core; Owner: postgres
--

SELECT pg_catalog.setval('hpms_core.users_user_id_seq', 4, true);


--
-- Name: approval_history approval_history_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.approval_history
    ADD CONSTRAINT approval_history_pkey PRIMARY KEY (history_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id);


--
-- Name: client_contracts client_contracts_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.client_contracts
    ADD CONSTRAINT client_contracts_pkey PRIMARY KEY (contract_id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (client_id);


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.contract_templates
    ADD CONSTRAINT contract_templates_pkey PRIMARY KEY (template_id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (contract_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: payroll_periods payroll_periods_client_id_period_month_period_year_key; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_client_id_period_month_period_year_key UNIQUE (client_id, period_month, period_year);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (period_id);


--
-- Name: salaries salaries_employee_id_pay_period_key; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.salaries
    ADD CONSTRAINT salaries_employee_id_pay_period_key UNIQUE (employee_id, pay_period);


--
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (salary_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_approval_history_action_by; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_approval_history_action_by ON hpms_core.approval_history USING btree (action_by);


--
-- Name: idx_approval_history_created; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_approval_history_created ON hpms_core.approval_history USING btree (created_at DESC);


--
-- Name: idx_audit_action_time; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_audit_action_time ON hpms_core.audit_logs USING btree (action_type, "timestamp" DESC);


--
-- Name: idx_audit_user_time; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_audit_user_time ON hpms_core.audit_logs USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_client_contracts_client; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_client_contracts_client ON hpms_core.client_contracts USING btree (client_id);


--
-- Name: idx_client_contracts_end_date; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_client_contracts_end_date ON hpms_core.client_contracts USING btree (end_date) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_client_contracts_status; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_client_contracts_status ON hpms_core.client_contracts USING btree (status);


--
-- Name: idx_contract_templates_type; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_contract_templates_type ON hpms_core.contract_templates USING btree (contract_type);


--
-- Name: idx_contracts_employee; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_contracts_employee ON hpms_core.contracts USING btree (employee_id);


--
-- Name: idx_contracts_end_date; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_contracts_end_date ON hpms_core.contracts USING btree (end_date) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_contracts_status ON hpms_core.contracts USING btree (status);


--
-- Name: idx_employees_email; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_employees_email ON hpms_core.employees USING btree (email);


--
-- Name: idx_employees_email_unique; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE UNIQUE INDEX idx_employees_email_unique ON hpms_core.employees USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_notifications_batch; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_notifications_batch ON hpms_core.notifications USING btree (batch_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_notifications_created ON hpms_core.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_notifications_user ON hpms_core.notifications USING btree (user_id, is_read);


--
-- Name: idx_salaries_employee_period; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_salaries_employee_period ON hpms_core.salaries USING btree (employee_id, pay_period DESC);


--
-- Name: idx_salaries_pay_period; Type: INDEX; Schema: hpms_core; Owner: postgres
--

CREATE INDEX idx_salaries_pay_period ON hpms_core.salaries USING btree (pay_period);


--
-- Name: client_contracts trg_client_contracts_updated_at; Type: TRIGGER; Schema: hpms_core; Owner: postgres
--

CREATE TRIGGER trg_client_contracts_updated_at BEFORE UPDATE ON hpms_core.client_contracts FOR EACH ROW EXECUTE FUNCTION hpms_core.update_client_contracts_timestamp();


--
-- Name: contract_templates trg_contract_templates_ts; Type: TRIGGER; Schema: hpms_core; Owner: postgres
--

CREATE TRIGGER trg_contract_templates_ts BEFORE UPDATE ON hpms_core.contract_templates FOR EACH ROW EXECUTE FUNCTION hpms_core.update_contract_templates_ts();


--
-- Name: contracts trg_contracts_updated_at; Type: TRIGGER; Schema: hpms_core; Owner: postgres
--

CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON hpms_core.contracts FOR EACH ROW EXECUTE FUNCTION hpms_core.update_contracts_timestamp();


--
-- Name: payroll_periods trg_payroll_periods_updated; Type: TRIGGER; Schema: hpms_core; Owner: postgres
--

CREATE TRIGGER trg_payroll_periods_updated BEFORE UPDATE ON hpms_core.payroll_periods FOR EACH ROW EXECUTE FUNCTION hpms_core.touch_payroll_periods();


--
-- Name: approval_history approval_history_action_by_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.approval_history
    ADD CONSTRAINT approval_history_action_by_fkey FOREIGN KEY (action_by) REFERENCES hpms_core.users(user_id) ON DELETE RESTRICT;


--
-- Name: approval_history approval_history_period_id_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.approval_history
    ADD CONSTRAINT approval_history_period_id_fkey FOREIGN KEY (period_id) REFERENCES hpms_core.payroll_periods(period_id) ON DELETE CASCADE;


--
-- Name: client_contracts client_contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.client_contracts
    ADD CONSTRAINT client_contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES hpms_core.clients(client_id) ON DELETE CASCADE;


--
-- Name: contracts contracts_template_id_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.contracts
    ADD CONSTRAINT contracts_template_id_fkey FOREIGN KEY (template_id) REFERENCES hpms_core.contract_templates(template_id) ON DELETE SET NULL;


--
-- Name: employees employees_client_id_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.employees
    ADD CONSTRAINT employees_client_id_fkey FOREIGN KEY (client_id) REFERENCES hpms_core.clients(client_id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_client_id_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_client_id_fkey FOREIGN KEY (client_id) REFERENCES hpms_core.clients(client_id) ON DELETE CASCADE;


--
-- Name: payroll_periods payroll_periods_hr_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_hr_reviewed_by_fkey FOREIGN KEY (hr_reviewed_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_md_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_md_reviewed_by_fkey FOREIGN KEY (md_reviewed_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_sent_to_bank_by_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_sent_to_bank_by_fkey FOREIGN KEY (sent_to_bank_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_submitted_by_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.payroll_periods
    ADD CONSTRAINT payroll_periods_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;


--
-- Name: salaries salaries_md_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.salaries
    ADD CONSTRAINT salaries_md_reviewed_by_fkey FOREIGN KEY (md_reviewed_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;


--
-- Name: salaries salaries_period_id_fkey; Type: FK CONSTRAINT; Schema: hpms_core; Owner: postgres
--

ALTER TABLE ONLY hpms_core.salaries
    ADD CONSTRAINT salaries_period_id_fkey FOREIGN KEY (period_id) REFERENCES hpms_core.payroll_periods(period_id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

