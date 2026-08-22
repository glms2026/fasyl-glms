package com.glms.general_ledger_management_system.Config;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import jakarta.persistence.EntityManagerFactory;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.HashMap;

@Configuration
@ConditionalOnProperty(
        name = "app.datasource.oracle.url"
)
@EnableJpaRepositories(
        basePackages =
                "com.glms.general_ledger_management_system.Repository.oracle",
        entityManagerFactoryRef = "oracleEntityManagerFactory",
        transactionManagerRef = "oracleTransactionManager"
)
public class OracleDataSourceConfig {

    @Bean(name = "oracleDataSource")
    public DataSource oracleDataSource(
            Environment environment
    ) {

        HikariConfig config = new HikariConfig();

        config.setJdbcUrl(
                environment.getProperty(
                        "app.datasource.oracle.url"
                )
        );

        config.setUsername(
                environment.getProperty(
                        "app.datasource.oracle.username"
                )
        );

        config.setPassword(
                environment.getProperty(
                        "app.datasource.oracle.password"
                )
        );

        config.setDriverClassName(
                environment.getProperty(
                        "app.datasource.oracle.driver-class-name",
                        "oracle.jdbc.OracleDriver"
                )
        );

        config.setMaximumPoolSize(5);

        config.setReadOnly(true);

        return new HikariDataSource(config);
    }

    @Bean(name = "oracleEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean
    oracleEntityManagerFactory(
            @Qualifier("oracleDataSource")
            DataSource dataSource
    ) {

        LocalContainerEntityManagerFactoryBean factory =
                new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(dataSource);

        factory.setPackagesToScan(
                "com.glms.general_ledger_management_system.Model.oracle"
        );

        HibernateJpaVendorAdapter vendorAdapter =
                new HibernateJpaVendorAdapter();

        vendorAdapter.setDatabasePlatform(
                "org.hibernate.dialect.OracleDialect"
        );

        factory.setJpaVendorAdapter(vendorAdapter);

        factory.setJpaPropertyMap(new HashMap<>());

        return factory;
    }

    @Bean(name = "oracleTransactionManager")
    public PlatformTransactionManager
    oracleTransactionManager(
            @Qualifier("oracleEntityManagerFactory")
            EntityManagerFactory entityManagerFactory
    ) {

        return new JpaTransactionManager(
                entityManagerFactory
        );
    }
}