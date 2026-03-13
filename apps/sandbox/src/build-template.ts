import { TEMPLATE_CONFIG } from './template.js';

async function main() {
  console.log('Building E2B template with config:');
  console.log(JSON.stringify(TEMPLATE_CONFIG, null, 2));
  console.log('');
  console.log('To build the E2B template, run:');
  console.log(`  e2b template build --name ${TEMPLATE_CONFIG.alias} --cmd "${TEMPLATE_CONFIG.startCmd}" --cpu-count ${TEMPLATE_CONFIG.cpuCount} --memory-mb ${TEMPLATE_CONFIG.memoryMB}`);
  console.log('');
  console.log('Or use the E2B dashboard to create a template from the Docker image:');
  console.log(`  ${TEMPLATE_CONFIG.image}`);
}

main().catch(console.error);
