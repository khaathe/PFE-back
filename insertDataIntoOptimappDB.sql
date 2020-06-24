-- phpMyAdmin SQL Dump
-- version 4.8.4
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le :  mar. 23 juin 2020 à 13:43
-- Version du serveur :  10.1.37-MariaDB
-- Version de PHP :  7.3.1

--
-- Suppression des données présentes en table
--

TRUNCATE TABLE activity;
TRUNCATE TABLE activitytype;
TRUNCATE TABLE activitystate;
TRUNCATE TABLE comments;
TRUNCATE TABLE period;
TRUNCATE TABLE role;
TRUNCATE TABLE user;

-- --------------------------------------------------------

--
-- Déchargement des données de la table activity
--

-- On insère pas de données dans cette table au préalable
-- La ligne en dessous est un exemple.
-- INSERT INTO activity (idA, idU, period, dateActivity, activityType) VALUES(1, 'bosqueth', 'MATIN', '2020-06-15', 'NANODX');

-- --------------------------------------------------------

--
-- Déchargement des données de la table activitytype
--

INSERT INTO activitytype (`code`, libelle, state) VALUES('ADMINISTRATIF_LOGISTIQUE', 'Administratif ou Logistique', 'ACTIVE');
INSERT INTO activitytype (`code`, libelle, state) VALUES('CONGES', 'Congés', 'ACTIVE');
INSERT INTO activitytype (`code`, libelle, state) VALUES('DEPLACEMENT', 'Déplacement', 'ACTIVE');
INSERT INTO activitytype (`code`, libelle, state) VALUES('FORMATION', 'Formation', 'ACTIVE');
INSERT INTO activitytype (`code`, libelle, state) VALUES('PRODUCTION', 'Production', 'ACTIVE');

-- --------------------------------------------------------

--
-- Déchargement des données de la table comments
--

-- On insère pas de données dans cette table au préalable
-- La ligne en dessous est un exemple.
-- INSERT INTO comments (idC, idA, comments) VALUES(1, 1, 'test commentaire matin');

-- --------------------------------------------------------

--
-- Déchargement des données de la table period
--

INSERT INTO period (`code`, libelle) VALUES('APRES_MIDI', 'Après-Midi');
INSERT INTO period (`code`, libelle) VALUES('MATIN', 'Matin');

-- --------------------------------------------------------

--
-- Déchargement des données de la table role
--

INSERT INTO role (`code`, libelle) VALUES('ADMIN', 'Admin');
INSERT INTO role (`code`, libelle) VALUES('STANDARD', 'Standard');

-- --------------------------------------------------------

--
-- Déchargement des données de la table `user`
--

-- Utilisateur admin de base
INSERT INTO `user` (idU, `password`, nom, prenom, role) VALUES('admin', 'sudoptimapp', '', '', 'ADMIN');

-- --------------------------------------------------------

--
-- Déchargement des données de la table activitystate
--

INSERT INTO activitystate (state) VALUES('ACTIVE');
INSERT INTO activitystate (state) VALUES('INACTIVE');

-- --------------------------------------------------------