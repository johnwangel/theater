
drop table if exists book;
create table book (
  book_id serial  PRIMARY KEY,
  show_id integer  NOT NULL,
  artist_id integer  NOT NULL,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  CONSTRAINT bshow_fk FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT bart_fk FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE
);

drop table if exists music;
create table music (
  music_id serial  PRIMARY KEY,
  show_id integer  NOT NULL,
  artist_id integer  NOT NULL,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  CONSTRAINT mshow_fk FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT mart_fk FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE
);

drop table if exists lyrics;
create table lyrics (
  lyrics_id serial  PRIMARY KEY,
  show_id integer  NOT NULL,
  artist_id integer  NOT NULL,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  CONSTRAINT lshow_fk FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT lart_fk FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE
);

drop table if exists playwright;
create table playwright (
  playwright_id serial  PRIMARY KEY,
  show_id integer  NOT NULL,
  artist_id integer  NOT NULL,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  CONSTRAINT pshow_fk FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT part_fk FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE book TO theater_user;
GRANT ALL PRIVILEGES  ( book_id,show_id,artist_id,created_at,updated_at ) ON TABLE book TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE book_book_id_seq TO theater_user;


GRANT ALL PRIVILEGES ON TABLE music TO theater_user;
GRANT ALL PRIVILEGES  ( show_id,artist_id,created_at,updated_at ) ON TABLE music TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE music_music_id_seq TO theater_user;


GRANT ALL PRIVILEGES ON TABLE lyrics TO theater_user;
GRANT ALL PRIVILEGES  ( show_id,artist_id,created_at,updated_at ) ON TABLE lyrics TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE lyrics_lyrics_id_seq TO theater_user;

GRANT ALL PRIVILEGES ON TABLE playwright TO theater_user;
GRANT ALL PRIVILEGES  ( playwright_id, show_id,artist_id,created_at,updated_at ) ON TABLE playwright TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE playwright_playwright_id_seq TO theater_user;

drop table if exists cities;
create table cities (
  city_id serial PRIMARY KEY,
  name varchar(255) not null,
  state_id integer not null,
  CONSTRAINT cstate_fk FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE ON UPDATE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE cities TO theater_user;
GRANT ALL PRIVILEGES  ( city_id,name,state_id ) ON TABLE cities TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE cities_city_id_seq TO theater_user;


drop table if exists productions;
create table productions (
  production_id serial PRIMARY KEY,
  theater_id INTEGER not null,
  show_id INTEGER not null,
  venue_id INTEGER,
  start_date DATE,
  end_date DATE,
  cast_list TEXT,
  description TEXT,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  CONSTRAINT pprod_fk FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT pven_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ptheater_fk FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE ON UPDATE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE productions TO theater_user;
GRANT ALL PRIVILEGES  ( theater_id,show_id,venue_id,start_date,end_date,cast_list,description,created_at,updated_at) ON TABLE productions TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE productions_production_id_seq TO theater_user;


drop table if exists directors;
create table directors (
  director_id serial  PRIMARY KEY,
  production_id integer  NOT NULL,
  artist_id integer  NOT NULL,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  CONSTRAINT dshow_fk FOREIGN KEY (production_id) REFERENCES productions(production_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT dart_fk FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE directors TO theater_user;
GRANT ALL PRIVILEGES  ( director_id,production_id,artist_id,created_at,updated_at ) ON TABLE directors TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE directors_director_id_seq TO theater_user;

drop table if exists choreographers;
create table choreographers (
  choreographer_id serial  PRIMARY KEY,
  production_id integer  NOT NULL,
  artist_id integer  NOT NULL,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  CONSTRAINT cshow_fk FOREIGN KEY (production_id) REFERENCES productions(production_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT cprod_fk FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE choreographers TO theater_user;
GRANT ALL PRIVILEGES  ( choreographer_id,production_id,artist_id,created_at,updated_at ) ON TABLE choreographers TO theater_user;
GRANT ALL PRIVILEGES  ON SEQUENCE choreographers_choreographer_id_seq TO theater_user;

