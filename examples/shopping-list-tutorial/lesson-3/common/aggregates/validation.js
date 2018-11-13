export default {
    fieldRequired: (payload, field) => {
        if (!payload[field]) {
            throw new Error(`The "${field}" field is required`)
        }
    }
}