-- CreateTable
CREATE TABLE `Customer` (
    `shopifyId` VARCHAR(191) NOT NULL,
    `savedCart` JSON NOT NULL,

    PRIMARY KEY (`shopifyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
