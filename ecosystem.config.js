module.exports = {
    apps: [{
        name: "dccb-api",
        script: "uvicorn",
        args: "app.main:app --host 0.0.0.0 --port 8000",
        interpreter: "python",
        watch: false,
        instances: 1,
        exec_mode: "fork",
        env: {
            NODE_ENV: "production"
        }
    }, {
        name: "dccb-worker",
        script: "celery",
        args: "-A app.core.celery_app worker --loglevel=info",
        interpreter: "python",
        watch: false,
        instances: 1,
        exec_mode: "fork"
    }, {
        name: "dccb-beat",
        script: "celery",
        args: "-A app.core.celery_app beat --loglevel=info",
        interpreter: "python",
        watch: false,
        instances: 1,
        exec_mode: "fork"
    }]
}
