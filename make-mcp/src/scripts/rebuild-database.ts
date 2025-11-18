/**
 * Rebuild Database Script
 * Initializes the database and scrapes priority modules
 */

import { MakeDocsScraper } from '../scrapers/make-docs-scraper.js';
import { ModuleRepository } from '../database/module-repository.js';

async function main() {
    console.log('🔨 Rebuilding Make-MCP database...\n');

    const repository = new ModuleRepository();
    const scraper = new MakeDocsScraper(repository);

    try {
        // Check initial state
        const initialStats = repository.getStats();
        console.log('Initial database state:');
        console.log(`  Modules: ${initialStats.total_modules}`);
        console.log(`  Apps: ${initialStats.total_apps}`);
        console.log(`  Categories: ${initialStats.total_categories}\n`);

        // Scrape priority modules
        console.log('Starting module scraping...');
        await scraper.scrapePriorityModules();

        // Show final stats
        const finalStats = repository.getStats();
        console.log('\n✅ Database rebuild complete!');
        console.log('\nFinal database state:');
        console.log(`  Modules: ${finalStats.total_modules}`);
        console.log(`  Apps: ${finalStats.total_apps}`);
        console.log(`  Categories: ${finalStats.total_categories}`);
        console.log(`  Templates: ${finalStats.total_templates}`);
        console.log(`  Database size: ${finalStats.database_size}`);

        console.log('\n📊 Module breakdown by type:');
        const modules = repository.getAllModules(0, 1000);
        const typeCounts: Record<string, number> = {};
        modules.forEach(m => {
            typeCounts[m.module_type] = (typeCounts[m.module_type] || 0) + 1;
        });
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        scraper.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database rebuild failed:', error);
        scraper.close();
        process.exit(1);
    }
}

main();

