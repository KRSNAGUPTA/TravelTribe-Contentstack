const Stack = Contentstack.Stack({
    api_key:import.meta.env.VITE_CS_API_KEY,
    delivery_token:import.meta.env.VITE_CS_DEV_ACCESS_TOKEN,
    environment:import.meta.env.VITE_CS_DEV_ENV
}
);
// console.log("SDK Initialized")
export default Stack;