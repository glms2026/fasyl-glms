package com.glms.general_ledger_management_system.Model.postgres;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name="AUDIT_LOGS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "audit_log_seq"
    )
    @SequenceGenerator(
            name = "audit_log_seq",
            sequenceName = "AUDIT_LOG_SEQ",
            allocationSize = 1
    )
    private Long id;


    @Column(name = "username")
    private String username;


    @Column(name = "action")
    private String action;


    @Column(
            length = 4000,
            name = "description"
    )
    private String description;



    @Column(name = "created_at")
    private LocalDateTime createdAt;


}