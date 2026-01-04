FROM php:8.1-apache

# Install PHP extensions and MySQL client (for migrations)
RUN docker-php-ext-install pdo pdo_mysql && \
    apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy application files and migrations
COPY src/ /var/www/html/
COPY database/ /var/www/html/database/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

