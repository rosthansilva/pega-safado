from pydantic import BaseModel

class Imovel(BaseModel):
    localidade: str
    valor: float
    metragem: float