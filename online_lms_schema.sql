--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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

--
-- Name: after_lesson_completed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.after_lesson_completed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_course_id INTEGER;
BEGIN
  -- Get the course_id for the completed lesson
  SELECT m.course_id INTO v_course_id
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE l.id = NEW.lesson_id;

  -- Update the course progress
  PERFORM update_course_progress(NEW.user_id, v_course_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.after_lesson_completed() OWNER TO postgres;

--
-- Name: get_user_course_progress(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_course_progress(p_user_id integer, p_course_id integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', up.user_id,
    'user_name', up.user_name,
    'course_id', up.course_id,
    'course_title', up.course_title,
    'progress_percentage', up.progress_percentage,
    'last_activity', up.last_activity,
    'stats', json_build_object(
      'total_lessons', up.total_lessons,
      'completed_lessons', up.completed_lessons,
      'total_assignments', up.total_assignments,
      'completed_assignments', up.completed_assignments,
      'total_quizzes', up.total_quizzes,
      'completed_quizzes', up.completed_quizzes
    )
  ) INTO result
  FROM user_course_progress up
  WHERE up.user_id = p_user_id AND up.course_id = p_course_id;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;


ALTER FUNCTION public.get_user_course_progress(p_user_id integer, p_course_id integer) OWNER TO postgres;

--
-- Name: mark_lesson_completed(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_lesson_completed(p_user_id integer, p_lesson_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO completed_lessons (user_id, lesson_id)
  VALUES (p_user_id, p_lesson_id)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;
END;
$$;


ALTER FUNCTION public.mark_lesson_completed(p_user_id integer, p_lesson_id integer) OWNER TO postgres;

--
-- Name: update_course_progress(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_course_progress(p_user_id integer, p_course_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_total_items INTEGER;
  v_completed_items INTEGER;
  v_progress_percentage INTEGER;
  v_course_lessons INTEGER;
  v_course_assignments INTEGER;
  v_course_quizzes INTEGER;
  v_completed_lessons INTEGER;
  v_completed_assignments INTEGER;
  v_completed_quizzes INTEGER;
BEGIN
  -- Get total items in the course
  SELECT COUNT(*) INTO v_course_lessons
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;

  SELECT COUNT(*) INTO v_course_assignments
  FROM assignments a
  JOIN lessons l ON a.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;

  SELECT COUNT(*) INTO v_course_quizzes
  FROM quizzes q
  JOIN lessons l ON q.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;

  v_total_items := v_course_lessons + v_course_assignments + v_course_quizzes;

  -- Get completed items for this user and course
  SELECT COUNT(*) INTO v_completed_lessons
  FROM completed_lessons cl
  JOIN lessons l ON cl.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE cl.user_id = p_user_id AND m.course_id = p_course_id;

  SELECT COUNT(*) INTO v_completed_assignments
  FROM completed_assignments ca
  JOIN assignments a ON ca.assignment_id = a.id
  JOIN lessons l ON a.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE ca.user_id = p_user_id AND m.course_id = p_course_id;

  SELECT COUNT(*) INTO v_completed_quizzes
  FROM completed_quizzes cq
  JOIN quizzes q ON cq.quiz_id = q.id
  JOIN lessons l ON q.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE cq.user_id = p_user_id AND m.course_id = p_course_id;

  v_completed_items := v_completed_lessons + v_completed_assignments + v_completed_quizzes;

  -- Calculate progress percentage (0-100)
  IF v_total_items > 0 THEN
    v_progress_percentage := (v_completed_items * 100) / v_total_items;
  ELSE
    v_progress_percentage := 0;
  END IF;

  -- Update or create enrollment record
  INSERT INTO enrollments (user_id, course_id, progress, completed_at)
  VALUES (
    p_user_id, 
    p_course_id, 
    v_progress_percentage,
    CASE WHEN v_progress_percentage = 100 THEN CURRENT_TIMESTAMP ELSE NULL END
  )
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET 
    progress = EXCLUDED.progress,
    completed_at = EXCLUDED.completed_at;

  RETURN v_progress_percentage;
END;
$$;


ALTER FUNCTION public.update_course_progress(p_user_id integer, p_course_id integer) OWNER TO postgres;

--
-- Name: update_progress_after_assignment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_progress_after_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_course_id INTEGER;
BEGIN
  -- Get the course_id for the completed assignment
  SELECT m.course_id INTO v_course_id
  FROM assignments a
  JOIN lessons l ON a.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE a.id = NEW.assignment_id;

  -- Update the course progress
  PERFORM update_course_progress(NEW.user_id, v_course_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_progress_after_assignment() OWNER TO postgres;

--
-- Name: update_progress_after_quiz(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_progress_after_quiz() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_course_id INTEGER;
BEGIN
  -- Get the course_id for the completed quiz
  SELECT m.course_id INTO v_course_id
  FROM quizzes q
  JOIN lessons l ON q.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE q.id = NEW.quiz_id;

  -- Update the course progress
  PERFORM update_course_progress(NEW.user_id, v_course_id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_progress_after_quiz() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    lesson_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    deadline timestamp without time zone,
    max_score integer DEFAULT 100,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: completed_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.completed_assignments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    assignment_id integer NOT NULL,
    completed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    score integer
);


ALTER TABLE public.completed_assignments OWNER TO postgres;

--
-- Name: completed_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.completed_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.completed_assignments_id_seq OWNER TO postgres;

--
-- Name: completed_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.completed_assignments_id_seq OWNED BY public.completed_assignments.id;


--
-- Name: completed_lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.completed_lessons (
    id integer NOT NULL,
    user_id integer NOT NULL,
    lesson_id integer NOT NULL,
    completed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.completed_lessons OWNER TO postgres;

--
-- Name: completed_lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.completed_lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.completed_lessons_id_seq OWNER TO postgres;

--
-- Name: completed_lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.completed_lessons_id_seq OWNED BY public.completed_lessons.id;


--
-- Name: completed_quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.completed_quizzes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    quiz_id integer NOT NULL,
    completed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    score integer
);


ALTER TABLE public.completed_quizzes OWNER TO postgres;

--
-- Name: completed_quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.completed_quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.completed_quizzes_id_seq OWNER TO postgres;

--
-- Name: completed_quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.completed_quizzes_id_seq OWNED BY public.completed_quizzes.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    instructor_id integer NOT NULL,
    category_id integer,
    price numeric(10,2) DEFAULT 0.00,
    thumbnail_url character varying(255),
    is_published boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    progress integer DEFAULT 0
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    module_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content_type character varying(50) NOT NULL,
    content_url character varying(255),
    duration integer DEFAULT 0,
    "order" integer NOT NULL,
    is_free boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lessons_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['video'::character varying, 'quiz'::character varying, 'text'::character varying, 'assignment'::character varying])::text[])))
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_id_seq OWNER TO postgres;

--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "order" integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    lesson_id integer NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    correct_answer character varying(255) NOT NULL,
    max_score integer DEFAULT 10,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quizzes_id_seq OWNER TO postgres;

--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    course_id integer,
    user_id integer,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    user_id integer NOT NULL,
    submission_url character varying(255) NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    grade integer,
    feedback text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_id_seq OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    role character varying(50) NOT NULL,
    oauth_provider character varying(50),
    oauth_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    avatar text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'instructor'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: user_course_progress; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_course_progress AS
 SELECT u.id AS user_id,
    u.name AS user_name,
    c.id AS course_id,
    c.title AS course_title,
    count(DISTINCT l.id) AS total_lessons,
    count(DISTINCT cl.lesson_id) AS completed_lessons,
    count(DISTINCT a.id) AS total_assignments,
    count(DISTINCT ca.assignment_id) AS completed_assignments,
    count(DISTINCT q.id) AS total_quizzes,
    count(DISTINCT cq.quiz_id) AS completed_quizzes,
        CASE
            WHEN (((count(DISTINCT l.id) + count(DISTINCT a.id)) + count(DISTINCT q.id)) > 0) THEN round((((((count(DISTINCT cl.lesson_id))::numeric + (count(DISTINCT ca.assignment_id))::numeric) + (count(DISTINCT cq.quiz_id))::numeric) * 100.0) / (((count(DISTINCT l.id) + count(DISTINCT a.id)) + count(DISTINCT q.id)))::numeric))
            ELSE (0)::numeric
        END AS progress_percentage,
    max(GREATEST(NULLIF(cl.completed_at, '1970-01-01 02:00:00+02'::timestamp with time zone), NULLIF(ca.completed_at, '1970-01-01 02:00:00+02'::timestamp with time zone), NULLIF(cq.completed_at, '1970-01-01 02:00:00+02'::timestamp with time zone))) AS last_activity
   FROM ((((((((public.users u
     CROSS JOIN public.courses c)
     LEFT JOIN public.modules m ON ((m.course_id = c.id)))
     LEFT JOIN public.lessons l ON ((l.module_id = m.id)))
     LEFT JOIN public.assignments a ON ((a.lesson_id = l.id)))
     LEFT JOIN public.quizzes q ON ((q.lesson_id = l.id)))
     LEFT JOIN public.completed_lessons cl ON (((cl.lesson_id = l.id) AND (cl.user_id = u.id))))
     LEFT JOIN public.completed_assignments ca ON (((ca.assignment_id = a.id) AND (ca.user_id = u.id))))
     LEFT JOIN public.completed_quizzes cq ON (((cq.quiz_id = q.id) AND (cq.user_id = u.id))))
  GROUP BY u.id, u.name, c.id, c.title;


ALTER VIEW public.user_course_progress OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer,
    session_id character varying(255) NOT NULL,
    last_activity timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


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
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: completed_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_assignments ALTER COLUMN id SET DEFAULT nextval('public.completed_assignments_id_seq'::regclass);


--
-- Name: completed_lessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_lessons ALTER COLUMN id SET DEFAULT nextval('public.completed_lessons_id_seq'::regclass);


--
-- Name: completed_quizzes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_quizzes ALTER COLUMN id SET DEFAULT nextval('public.completed_quizzes_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: completed_assignments completed_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_assignments
    ADD CONSTRAINT completed_assignments_pkey PRIMARY KEY (id);


--
-- Name: completed_assignments completed_assignments_user_id_assignment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_assignments
    ADD CONSTRAINT completed_assignments_user_id_assignment_id_key UNIQUE (user_id, assignment_id);


--
-- Name: completed_lessons completed_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_lessons
    ADD CONSTRAINT completed_lessons_pkey PRIMARY KEY (id);


--
-- Name: completed_lessons completed_lessons_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_lessons
    ADD CONSTRAINT completed_lessons_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: completed_quizzes completed_quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_quizzes
    ADD CONSTRAINT completed_quizzes_pkey PRIMARY KEY (id);


--
-- Name: completed_quizzes completed_quizzes_user_id_quiz_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_quizzes
    ADD CONSTRAINT completed_quizzes_user_id_quiz_id_key UNIQUE (user_id, quiz_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_user_id_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_session_id_key UNIQUE (user_id, session_id);


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
-- Name: idx_assignments_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_lesson ON public.assignments USING btree (lesson_id);


--
-- Name: idx_completed_assignments_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_completed_assignments_assignment ON public.completed_assignments USING btree (assignment_id);


--
-- Name: idx_completed_assignments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_completed_assignments_user ON public.completed_assignments USING btree (user_id);


--
-- Name: idx_completed_lessons_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_completed_lessons_lesson ON public.completed_lessons USING btree (lesson_id);


--
-- Name: idx_completed_lessons_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_completed_lessons_user ON public.completed_lessons USING btree (user_id);


--
-- Name: idx_completed_quizzes_quiz; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_completed_quizzes_quiz ON public.completed_quizzes USING btree (quiz_id);


--
-- Name: idx_completed_quizzes_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_completed_quizzes_user ON public.completed_quizzes USING btree (user_id);


--
-- Name: idx_courses_instructor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_instructor ON public.courses USING btree (instructor_id);


--
-- Name: idx_enrollments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_user ON public.enrollments USING btree (user_id);


--
-- Name: idx_lessons_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_module ON public.lessons USING btree (module_id);


--
-- Name: idx_modules_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_course ON public.modules USING btree (course_id);


--
-- Name: idx_quizzes_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quizzes_lesson ON public.quizzes USING btree (lesson_id);


--
-- Name: idx_submissions_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_assignment ON public.submissions USING btree (assignment_id);


--
-- Name: idx_submissions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_user ON public.submissions USING btree (user_id);


--
-- Name: completed_assignments tr_after_assignment_completed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_after_assignment_completed AFTER INSERT OR UPDATE ON public.completed_assignments FOR EACH ROW EXECUTE FUNCTION public.update_progress_after_assignment();


--
-- Name: completed_lessons tr_after_lesson_completed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_after_lesson_completed AFTER INSERT OR UPDATE ON public.completed_lessons FOR EACH ROW EXECUTE FUNCTION public.after_lesson_completed();


--
-- Name: completed_quizzes tr_after_quiz_completed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_after_quiz_completed AFTER INSERT OR UPDATE ON public.completed_quizzes FOR EACH ROW EXECUTE FUNCTION public.update_progress_after_quiz();


--
-- Name: assignments assignments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: completed_assignments completed_assignments_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_assignments
    ADD CONSTRAINT completed_assignments_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: completed_assignments completed_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_assignments
    ADD CONSTRAINT completed_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: completed_lessons completed_lessons_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_lessons
    ADD CONSTRAINT completed_lessons_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: completed_lessons completed_lessons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_lessons
    ADD CONSTRAINT completed_lessons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: completed_quizzes completed_quizzes_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_quizzes
    ADD CONSTRAINT completed_quizzes_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: completed_quizzes completed_quizzes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.completed_quizzes
    ADD CONSTRAINT completed_quizzes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: quizzes quizzes_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: reviews reviews_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

