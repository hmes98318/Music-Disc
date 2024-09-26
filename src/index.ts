/**
 * Some web features are unavailable
 * ENABLE_LOCAL_NODE = false
 */
import { Controller } from "./Controller";


const controller = new Controller();

controller.init();


process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});
