-- phpMyAdmin SQL Dump
-- version 4.8.4
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le :  mar. 23 juin 2020 à 13:43
-- Version du serveur :  10.1.37-MariaDB
-- Version de PHP :  7.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  optimapp
--
CREATE DATABASE IF NOT EXISTS optimapp DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE optimapp;

--
-- Suppression des tables
-- 

DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS activity;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS activitytype;
DROP TABLE IF EXISTS period;
DROP TABLE IF EXISTS activitystate;


-- --------------------------------------------------------

-- --------------------------------------------------------

--
-- Structure de la table activity
--

CREATE TABLE activity (
  idA int(11) NOT NULL,
  idU varchar(15) NOT NULL,
  period varchar(30) NOT NULL,
  dateActivity date NOT NULL,
  activityType varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Structure de la table activitystate
--

CREATE TABLE activitystate (
  state varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table activitytype
--

CREATE TABLE activitytype (
  code varchar(30) NOT NULL,
  libelle varchar(30) NOT NULL,
  state varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Structure de la table comments
--

CREATE TABLE comments (
  idC int(11) NOT NULL,
  idA int(11) NOT NULL,
  comments varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Structure de la table period
--

CREATE TABLE period (
  code varchar(30) NOT NULL,
  libelle varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Structure de la table role
--

CREATE TABLE `role` (
  code varchar(30) NOT NULL,
  libelle varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  idU varchar(15) NOT NULL,
  password varchar(30) NOT NULL,
  nom varchar(30) NOT NULL,
  prenom varchar(30) NOT NULL,
  role varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table activity
--
ALTER TABLE activity
  ADD PRIMARY KEY (idA),
  ADD UNIQUE KEY idU (idU,period,dateActivity),
  ADD KEY activityType (activityType),
  ADD KEY period (period);

--
-- Index pour la table activitystate
--
ALTER TABLE activitystate
  ADD PRIMARY KEY (state);

--
-- Index pour la table activitytype
--
ALTER TABLE activitytype
  ADD PRIMARY KEY (code),
  ADD KEY fk_state (state);

--
-- Index pour la table comments
--
ALTER TABLE comments
  ADD PRIMARY KEY (idC),
  ADD KEY idA (idA) USING BTREE;

--
-- Index pour la table period
--
ALTER TABLE period
  ADD PRIMARY KEY (code);

--
-- Index pour la table role
--
ALTER TABLE role
  ADD PRIMARY KEY (code);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (idU),
  ADD KEY role (role);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table activity
--
ALTER TABLE activity
  MODIFY idA int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT pour la table comments
--
ALTER TABLE comments
  MODIFY idC int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table activity
--
ALTER TABLE activity
  ADD CONSTRAINT activityType FOREIGN KEY (activityType) REFERENCES activitytype (code),
  ADD CONSTRAINT period FOREIGN KEY (period) REFERENCES period (code),
  ADD CONSTRAINT user FOREIGN KEY (idU) REFERENCES `user` (idU);

--
-- Contraintes pour la table activitytype
--
ALTER TABLE activitytype
  ADD CONSTRAINT fk_state FOREIGN KEY (state) REFERENCES activitystate (state);

--
-- Contraintes pour la table comments
--
ALTER TABLE comments
  ADD CONSTRAINT `FOREIGN KEY` FOREIGN KEY (idA) REFERENCES activity (idA);

--
-- Contraintes pour la table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT role FOREIGN KEY (role) REFERENCES role (code);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
