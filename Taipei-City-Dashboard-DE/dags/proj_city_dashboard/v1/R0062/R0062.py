from airflow import DAG
from operators.common_pipeline import CommonDag


def _R0062(**kwargs):
    from airflow.models import Variable
    from proj_city_dashboard.R0062.renew_etl import renew_etl

    # Config
    URL = Variable.get("R0062_URL", "")
    GEOMETRY_TYPE = "MultiPolygon"
    FROM_CRS = 4326

    # ETL
    renew_etl(URL, FROM_CRS, GEOMETRY_TYPE, **kwargs)


dag = CommonDag(proj_folder="proj_city_dashboard/v1", dag_folder="R0062")
dag.create_dag(etl_func=_R0062)
