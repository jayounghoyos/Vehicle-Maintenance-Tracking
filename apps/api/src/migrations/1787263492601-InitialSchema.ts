import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787263492601 implements MigrationInterface {
    name = 'InitialSchema1787263492601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organizations" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "owner_name" character varying NOT NULL, "address" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "organizations_name_unique" ON "organizations"  ("name") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "maintenance_tasks" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_a9cc63a718de2f4e13657c1942a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "maintenance_tasks_organization_name_unique" ON "maintenance_tasks"  ("organization_id", "name") `);
        await queryRunner.query(`CREATE TABLE "vehicle_models" ("id" SERIAL NOT NULL, "make" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_1c01752184334fdbcae9bbaa67f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "vehicle_models_make_name_unique" ON "vehicle_models"  ("make", "name") `);
        await queryRunner.query(`CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'in_shop', 'out_of_service')`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "plate" character varying NOT NULL, "model_id" integer NOT NULL, "year" integer, "odometer_km" integer NOT NULL DEFAULT '0', "status" "public"."vehicle_status" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "vehicles_organization_plate_unique" ON "vehicles"  ("organization_id", "plate") `);
        await queryRunner.query(`CREATE TABLE "maintenance_schedules" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "vehicle_id" integer NOT NULL, "task_id" integer NOT NULL, "interval_days" integer, "interval_km" integer, "next_due_date" date, "next_due_km" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ce3383b6ff08ab48a28f515e4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('fleet_coordinator', 'mechanic', 'operations_manager')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "full_name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."user_role" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_type" AS ENUM('preventive', 'corrective')`);
        await queryRunner.query(`CREATE TABLE "service_events" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "vehicle_id" integer NOT NULL, "schedule_id" integer, "task_id" integer NOT NULL, "recorded_by" integer NOT NULL, "type" "public"."service_type" NOT NULL, "performed_at" date NOT NULL, "odometer_km" integer, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1608e9859ce1f28c77cc896fdbc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_event_photos" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "service_event_id" integer NOT NULL, "storage_key" character varying NOT NULL, "uploaded_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6fb51a9ae65c770806507cafc15" UNIQUE ("storage_key"), CONSTRAINT "PK_b75b15e33e1409b9eb2ab409f78" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "service_event_photos_service_event_idx" ON "service_event_photos"  ("service_event_id") `);
        await queryRunner.query(`ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "FK_ceb44790b4a5b7c0ea20bcba27a" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_f9603f682ee2d499d3abfd50225" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c4fe98a2147b08df1ab56df5313" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "FK_8ca6942f90008b5bbac4a19686a" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "FK_0dd4012f966f9e4ead7f0e8d08d" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "FK_363d3807807041789fee7d56051" FOREIGN KEY ("task_id") REFERENCES "maintenance_tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_21a659804ed7bf61eb91688dea7" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_events" ADD CONSTRAINT "FK_1bf13d610fe8c87cf9fe08bf63a" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_events" ADD CONSTRAINT "FK_28eda8de82b0c362124f2fb6b18" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_events" ADD CONSTRAINT "FK_5b5bb5ecca16a4cd8112478f026" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_events" ADD CONSTRAINT "FK_ab5d90c5059ea0f9c598fd529eb" FOREIGN KEY ("task_id") REFERENCES "maintenance_tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_events" ADD CONSTRAINT "FK_041c5b61c80f65514e1986c38a2" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_event_photos" ADD CONSTRAINT "FK_81c9b2f0616530453d9614fbf9c" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_event_photos" ADD CONSTRAINT "FK_1a9f928d0d260514760a6aedc45" FOREIGN KEY ("service_event_id") REFERENCES "service_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_event_photos" ADD CONSTRAINT "FK_cb36bed71728aa2a710f74a4076" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_event_photos" DROP CONSTRAINT "FK_cb36bed71728aa2a710f74a4076"`);
        await queryRunner.query(`ALTER TABLE "service_event_photos" DROP CONSTRAINT "FK_1a9f928d0d260514760a6aedc45"`);
        await queryRunner.query(`ALTER TABLE "service_event_photos" DROP CONSTRAINT "FK_81c9b2f0616530453d9614fbf9c"`);
        await queryRunner.query(`ALTER TABLE "service_events" DROP CONSTRAINT "FK_041c5b61c80f65514e1986c38a2"`);
        await queryRunner.query(`ALTER TABLE "service_events" DROP CONSTRAINT "FK_ab5d90c5059ea0f9c598fd529eb"`);
        await queryRunner.query(`ALTER TABLE "service_events" DROP CONSTRAINT "FK_5b5bb5ecca16a4cd8112478f026"`);
        await queryRunner.query(`ALTER TABLE "service_events" DROP CONSTRAINT "FK_28eda8de82b0c362124f2fb6b18"`);
        await queryRunner.query(`ALTER TABLE "service_events" DROP CONSTRAINT "FK_1bf13d610fe8c87cf9fe08bf63a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_21a659804ed7bf61eb91688dea7"`);
        await queryRunner.query(`ALTER TABLE "maintenance_schedules" DROP CONSTRAINT "FK_363d3807807041789fee7d56051"`);
        await queryRunner.query(`ALTER TABLE "maintenance_schedules" DROP CONSTRAINT "FK_0dd4012f966f9e4ead7f0e8d08d"`);
        await queryRunner.query(`ALTER TABLE "maintenance_schedules" DROP CONSTRAINT "FK_8ca6942f90008b5bbac4a19686a"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c4fe98a2147b08df1ab56df5313"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_f9603f682ee2d499d3abfd50225"`);
        await queryRunner.query(`ALTER TABLE "maintenance_tasks" DROP CONSTRAINT "FK_ceb44790b4a5b7c0ea20bcba27a"`);
        await queryRunner.query(`DROP INDEX "public"."service_event_photos_service_event_idx"`);
        await queryRunner.query(`DROP TABLE "service_event_photos"`);
        await queryRunner.query(`DROP TABLE "service_events"`);
        await queryRunner.query(`DROP TYPE "public"."service_type"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
        await queryRunner.query(`DROP TABLE "maintenance_schedules"`);
        await queryRunner.query(`DROP INDEX "public"."vehicles_organization_plate_unique"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TYPE "public"."vehicle_status"`);
        await queryRunner.query(`DROP INDEX "public"."vehicle_models_make_name_unique"`);
        await queryRunner.query(`DROP TABLE "vehicle_models"`);
        await queryRunner.query(`DROP INDEX "public"."maintenance_tasks_organization_name_unique"`);
        await queryRunner.query(`DROP TABLE "maintenance_tasks"`);
        await queryRunner.query(`DROP INDEX "public"."organizations_name_unique"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }

}
