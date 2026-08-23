package com.glms.general_ledger_management_system.Config;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.glms.general_ledger_management_system.Repository.postgres",
        entityManagerFactoryRef = "postgresEntityManagerFactory",
        transactionManagerRef = "postgresTransactionManager"
)
public class PostgresDataSourceConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    @Bean(name = "postgresDataSource")
    @Primary
    public DataSource postgresDataSource() {
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();
    }

    @Bean(name = "postgresEntityManagerFactory")
    @Primary
    public LocalContainerEntityManagerFactoryBean postgresEntityManagerFactory(
            @Qualifier("postgresDataSource") DataSource dataSource
    ) {
        HibernateJpaVendorAdapter vendorAdapter =
                new HibernateJpaVendorAdapter();

        vendorAdapter.setDatabasePlatform(
                "org.hibernate.dialect.PostgreSQLDialect"
        );

        LocalContainerEntityManagerFactoryBean factory =
                new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(dataSource);

        factory.setPackagesToScan(
                "com.glms.general_ledger_management_system.Model.postgres"
        );

        factory.setJpaVendorAdapter(vendorAdapter);

        return factory;
    }

    @Bean(name = "postgresTransactionManager")
    @Primary
    public JpaTransactionManager postgresTransactionManager(
            @Qualifier("postgresEntityManagerFactory")
            EntityManagerFactory entityManagerFactory
    ) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}