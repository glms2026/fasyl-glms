package com.glms.general_ledger_management_system.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

/**
 * ============================================================
 * WEB CONFIG
 * ============================================================
 *
 * Serializes Spring Data Page results as a stable PagedModel
 * JSON structure instead of the raw PageImpl.
 *
 * This removes the
 * "Serializing PageImpl instances as-is is not supported"
 * warning and guarantees the paginated response shape:
 *
 * {
 *   "content": [...],
 *   "page": { "size", "number", "totalElements", "totalPages" }
 * }
 *
 * Applies globally to every endpoint returning Page<T>.
 */
@Configuration
@EnableSpringDataWebSupport(
        pageSerializationMode = PageSerializationMode.VIA_DTO
)
public class WebConfig {
}
