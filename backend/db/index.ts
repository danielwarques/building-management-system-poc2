import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("building_management", {
  migrations: "./migrations",
});
