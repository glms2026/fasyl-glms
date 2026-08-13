package com.glms.general_ledger_management_system;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Full-context smoke test: boots the whole application against the
 * in-memory H2 database (test profile) to verify the context loads.
 */
@SpringBootTest
@ActiveProfiles("test")
class GeneralLedgerManagementSystemApplicationTests {

	@Test
	void contextLoads() {
	}

}
