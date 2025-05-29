-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : sam. 24 mai 2025 à 23:34
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `swapa`
--

-- --------------------------------------------------------

--
-- Structure de la table `class`
--

CREATE TABLE `class` (
  `ID_class` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `reciver_id` int(11) NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `SP_N_P` int(11) DEFAULT 0,
  `is_teacher_ready` tinyint(1) DEFAULT 0,
  `is_student_ready` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 0,
  `is_paused` tinyint(1) DEFAULT 0,
  `duration` int(11) NOT NULL DEFAULT 0,
  `time_gone` int(11) NOT NULL DEFAULT 0,
  `skill_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `class`
--

INSERT INTO `class` (`ID_class`, `request_id`, `sender_id`, `reciver_id`, `start_time`, `end_time`, `SP_N_P`, `is_teacher_ready`, `is_student_ready`, `is_active`, `is_paused`, `duration`, `time_gone`, `skill_id`) VALUES
(1, 2, 15, 2, NULL, NULL, 0, 0, 0, 0, 0, 1, 0, 8),
(2, 4, 2, 15, NULL, NULL, 0, 0, 0, 0, 0, 3, 0, 6);

-- --------------------------------------------------------

--
-- Structure de la table `class_files`
--

CREATE TABLE `class_files` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comment`
--

CREATE TABLE `comment` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `rating` float NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `comment`
--

INSERT INTO `comment` (`id`, `sender_id`, `receiver_id`, `comment`, `rating`, `createdAt`, `updatedAt`) VALUES
(8, 2, 3, 'she is a good teacher', 4, '2025-05-22 20:43:04', '2025-05-22 20:43:04'),
(9, 15, 3, 'she is', 3, '2025-05-22 21:25:46', '2025-05-22 21:25:46'),
(10, 2, 3, 'she is', 2, '2025-05-23 10:42:28', '2025-05-23 10:42:28'),
(11, 15, 2, 'she is a good teacher', 4, '2025-05-23 12:20:41', '2025-05-23 12:20:41');

-- --------------------------------------------------------

--
-- Structure de la table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `ID_notification` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `request`
--

CREATE TABLE `request` (
  `ID_request` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `reciver_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status_request` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `duration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `request`
--

INSERT INTO `request` (`ID_request`, `sender_id`, `reciver_id`, `skill_id`, `message`, `status_request`, `created_at`, `duration`) VALUES
(2, 15, 2, 8, 'i want to learn it', 'accepted', '2025-05-23 19:06:57', 1),
(3, 15, 2, 13, 'i want to learn it so much', 'rejected', '2025-05-23 19:07:21', 2),
(4, 2, 15, 6, 'hello i hope you can teach me', 'accepted', '2025-05-23 19:08:42', 3),
(5, 2, 15, 17, 'hello i hope you can teach me so much', 'pending', '2025-05-23 19:08:56', 3),
(6, 2, 3, 17, 'i want to learn it', 'pending', '2025-05-23 21:57:54', 2),
(7, 15, 2, 18, 'i want to learn it so much', 'accepted', '2025-05-23 22:05:22', 2);

-- --------------------------------------------------------

--
-- Structure de la table `skill`
--

CREATE TABLE `skill` (
  `ID_skill` int(11) NOT NULL,
  `skills_name` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `skill`
--

INSERT INTO `skill` (`ID_skill`, `skills_name`, `createdAt`, `updatedAt`) VALUES
(1, 'JavaScript', '2025-04-17 17:27:32', '2025-04-17 17:27:32'),
(2, 'UI Design', '2025-04-17 17:30:20', '2025-04-17 17:30:20'),
(3, 'React', '2025-04-17 17:30:20', '2025-04-17 17:30:20'),
(4, 'Node.js', '2025-04-17 17:30:20', '2025-04-17 17:30:20'),
(5, 'Git', '2025-04-17 17:30:20', '2025-04-17 17:30:20'),
(6, 'Js', '2025-05-01 12:03:45', '2025-05-01 12:03:45'),
(7, 'html', '2025-05-01 12:04:02', '2025-05-01 12:04:02'),
(8, 'C', '2025-05-01 12:04:02', '2025-05-01 12:04:02'),
(9, 'Machine learning', '2025-05-01 12:09:28', '2025-05-01 12:09:28'),
(10, 'Web development', '2025-05-01 12:11:24', '2025-05-01 12:11:24'),
(11, 'Cybersecurity', '2025-05-01 12:11:24', '2025-05-01 12:11:24'),
(12, 'Data science', '2025-05-01 12:11:55', '2025-05-01 12:11:55'),
(13, 'Algebra', '2025-05-01 12:22:33', '2025-05-01 12:22:33'),
(14, 'SQL', '2025-05-02 12:22:12', '2025-05-02 12:22:12'),
(15, 'C#', '2025-05-02 13:57:07', '2025-05-02 13:57:07'),
(16, 'AI', '2025-05-10 11:08:53', '2025-05-10 11:08:53'),
(17, 'Java', '2025-05-10 11:24:56', '2025-05-10 11:24:56'),
(18, 'css', '2025-05-23 15:42:29', '2025-05-23 15:42:29'),
(22, 'Analyse', '2025-05-23 16:05:02', '2025-05-23 16:05:02');

-- --------------------------------------------------------

--
-- Structure de la table `teachingsessions`
--

CREATE TABLE `teachingsessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `hours` float NOT NULL,
  `date` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `useractivity`
--

CREATE TABLE `useractivity` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `activityType` varchar(255) NOT NULL,
  `value` int(11) NOT NULL,
  `spEarned` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `useractivity`
--

INSERT INTO `useractivity` (`id`, `userId`, `activityType`, `value`, `spEarned`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'profile-completion', 1, 10, '2025-05-02 14:46:13', '2025-05-02 14:46:13'),
(2, 3, 'profile-completion', 1, 10, '2025-05-10 11:25:05', '2025-05-10 11:25:05'),
(3, 15, 'skills', 3, 6, '2025-05-22 21:24:40', '2025-05-22 21:24:40'),
(4, 15, 'profile-completion', 1, 10, '2025-05-22 21:24:54', '2025-05-22 21:24:54');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `ID_Users` int(11) NOT NULL,
  `Users_name` varchar(100) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `telegram` varchar(100) DEFAULT NULL,
  `discord` varchar(100) DEFAULT NULL,
  `SP` int(11) DEFAULT 0,
  `bio` text DEFAULT NULL,
  `total_time_teaching_h` float DEFAULT NULL,
  `total_time_learning_h` float DEFAULT NULL,
  `rate` float DEFAULT NULL,
  `nbr_rate` int(11) DEFAULT NULL,
  `sec_email` varchar(255) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `auth_provider` varchar(50) DEFAULT NULL,
  `provider_id` varchar(100) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `profileCompleted` tinyint(1) DEFAULT 0,
  `language` varchar(10) DEFAULT 'en',
  `dark_mode` tinyint(1) DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'available',
  `profile_picture` varchar(255) DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `verificationCode` varchar(255) DEFAULT NULL,
  `resetCode` varchar(255) DEFAULT NULL,
  `provider` varchar(255) DEFAULT 'local',
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`ID_Users`, `Users_name`, `first_name`, `last_name`, `email`, `password`, `birthday`, `telegram`, `discord`, `SP`, `bio`, `total_time_teaching_h`, `total_time_learning_h`, `rate`, `nbr_rate`, `sec_email`, `gender`, `is_admin`, `created_at`, `updated_at`, `auth_provider`, `provider_id`, `whatsapp`, `profileCompleted`, `language`, `dark_mode`, `status`, `profile_picture`, `isVerified`, `verificationCode`, `resetCode`, `provider`, `location`) VALUES
(2, 'ferielmenouer', 'feriel', 'menouer', 'ferielmenouerinformatique@gmail.com', '$2b$10$LDYUD5Nv4DZ/CrvqrjWO3eFPigOJwTou3lvkgt1sCEV1rZZvLOsZC', '2005-02-12', 'ferielmenouer', 'https://discord.gg/xxxxxxxx', 20, 'I am a student in computer engineering', 0, 0, 4, 1, NULL, NULL, 0, '2025-05-02 14:44:35', '2025-05-24 12:23:04', 'local', NULL, NULL, 1, 'en', 0, 'available', 'http://localhost:80/uploads/profile_pictures/2_1748089384168.png', 1, NULL, NULL, 'local', 'Algeria'),
(3, 'shadow10', 'serir', 'sihem', 'serirsiham107@gmail.com', '$2b$10$Y6j/hZNCPjHdEvHFMOHc8elh9R4qt7e3et2gQjUBcBII0kRJMfT2m', '2006-12-06', 'https://t.me/ferielmen', 'https://discord.gg/xxxxxxxx', 20, 'hey this is my bio', 0, 0, 3, 3, NULL, NULL, 0, '2025-05-10 11:06:20', '2025-05-23 10:42:28', 'local', NULL, NULL, 1, 'en', 0, 'available', NULL, 1, NULL, NULL, 'local', NULL),
(15, 'ferielllllllll', 'fer', 'men', 'ferielmenouer2@gmail.com', '$2b$10$ay9g51M7vqc/5OeSPVtxY.mnJrW3yo.F.QcUBi5U2../Jbojhlnyi', '2005-02-12', 'https://t.me/ferielmen', 'https://discord.gg/xxxxxxxx', 26, 'hey this is my bio', 0, 0, 0, 0, NULL, NULL, 0, '2025-05-22 21:22:34', '2025-05-22 21:24:54', 'local', NULL, NULL, 1, 'en', 0, 'EnLigne', 'http://localhost:80/uploads/profile_pictures/15_1747949067448.png', 1, NULL, NULL, 'local', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `userskills`
--

CREATE TABLE `userskills` (
  `userId` int(11) NOT NULL,
  `skillId` int(11) NOT NULL,
  `type` enum('teach','learn') NOT NULL,
  `ID_userSkill` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `userskills`
--

INSERT INTO `userskills` (`userId`, `skillId`, `type`, `ID_userSkill`) VALUES
(2, 6, 'learn', 1),
(2, 7, 'teach', 23),
(2, 8, 'teach', 34),
(2, 13, 'teach', 4),
(2, 15, 'learn', 5),
(2, 17, 'learn', 6),
(2, 18, 'teach', 19),
(2, 22, 'learn', 37),
(3, 7, 'learn', 8),
(3, 8, 'learn', 9),
(3, 13, 'teach', 10),
(3, 17, 'teach', 11),
(15, 6, 'teach', 12),
(15, 7, 'learn', 13),
(15, 12, 'learn', 14),
(15, 13, 'learn', 15),
(15, 17, 'teach', 16);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `class`
--
ALTER TABLE `class`
  ADD PRIMARY KEY (`ID_class`),
  ADD KEY `request_id` (`request_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `reciver_id` (`reciver_id`);

--
-- Index pour la table `class_files`
--
ALTER TABLE `class_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Index pour la table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`ID_notification`);

--
-- Index pour la table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`ID_request`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `reciver_id` (`reciver_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Index pour la table `skill`
--
ALTER TABLE `skill`
  ADD PRIMARY KEY (`ID_skill`),
  ADD UNIQUE KEY `skills_name` (`skills_name`);

--
-- Index pour la table `teachingsessions`
--
ALTER TABLE `teachingsessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_teach_user` (`user_id`),
  ADD KEY `fk_teach_skill` (`skill_id`);

--
-- Index pour la table `useractivity`
--
ALTER TABLE `useractivity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`ID_Users`);

--
-- Index pour la table `userskills`
--
ALTER TABLE `userskills`
  ADD PRIMARY KEY (`ID_userSkill`),
  ADD UNIQUE KEY `unique_user_skill_type` (`userId`,`skillId`,`type`),
  ADD KEY `userskills_ibfk_2` (`skillId`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `class`
--
ALTER TABLE `class`
  MODIFY `ID_class` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `class_files`
--
ALTER TABLE `class_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `comment`
--
ALTER TABLE `comment`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `ID_notification` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `request`
--
ALTER TABLE `request`
  MODIFY `ID_request` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `skill`
--
ALTER TABLE `skill`
  MODIFY `ID_skill` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT pour la table `teachingsessions`
--
ALTER TABLE `teachingsessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `useractivity`
--
ALTER TABLE `useractivity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `ID_Users` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `userskills`
--
ALTER TABLE `userskills`
  MODIFY `ID_userSkill` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `class`
--
ALTER TABLE `class`
  ADD CONSTRAINT `class_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `request` (`ID_request`),
  ADD CONSTRAINT `class_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`ID_Users`),
  ADD CONSTRAINT `class_ibfk_3` FOREIGN KEY (`reciver_id`) REFERENCES `users` (`ID_Users`);

--
-- Contraintes pour la table `class_files`
--
ALTER TABLE `class_files`
  ADD CONSTRAINT `class_files_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`ID_class`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_files_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID_Users`) ON DELETE CASCADE;

--
-- Contraintes pour la table `comment`
--
ALTER TABLE `comment`
  ADD CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`ID_Users`) ON DELETE CASCADE,
  ADD CONSTRAINT `comment_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`ID_Users`) ON DELETE CASCADE;

--
-- Contraintes pour la table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`ID_class`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID_Users`) ON DELETE CASCADE;

--
-- Contraintes pour la table `request`
--
ALTER TABLE `request`
  ADD CONSTRAINT `request_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`ID_Users`),
  ADD CONSTRAINT `request_ibfk_2` FOREIGN KEY (`reciver_id`) REFERENCES `users` (`ID_Users`),
  ADD CONSTRAINT `request_ibfk_3` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`ID_skill`);

--
-- Contraintes pour la table `teachingsessions`
--
ALTER TABLE `teachingsessions`
  ADD CONSTRAINT `fk_teach_skill` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`ID_skill`),
  ADD CONSTRAINT `fk_teach_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`ID_Users`);

--
-- Contraintes pour la table `useractivity`
--
ALTER TABLE `useractivity`
  ADD CONSTRAINT `useractivity_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`ID_Users`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `userskills`
--
ALTER TABLE `userskills`
  ADD CONSTRAINT `userskills_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`ID_Users`) ON DELETE CASCADE,
  ADD CONSTRAINT `userskills_ibfk_2` FOREIGN KEY (`skillId`) REFERENCES `skill` (`ID_skill`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
