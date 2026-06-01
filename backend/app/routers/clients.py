from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from app.repositories.client import ClientRepository
from app.repositories.order import OrderRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("")
async def list_clients(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = ClientRepository(db)
    clients = await repo.get_all()
    return ok([ClientOut.model_validate(c).model_dump() for c in clients])


@router.post("")
async def create_client(body: ClientCreate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = ClientRepository(db)
    client = await repo.create(body.model_dump())
    return ok(ClientOut.model_validate(client).model_dump(), "Client created")


@router.get("/{client_id}")
async def get_client(client_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = ClientRepository(db)
    client = await repo.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ok(ClientOut.model_validate(client).model_dump())


@router.put("/{client_id}")
async def update_client(client_id: int, body: ClientUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = ClientRepository(db)
    client = await repo.update(client_id, body.model_dump(exclude_none=True))
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ok(ClientOut.model_validate(client).model_dump(), "Client updated")


@router.delete("/{client_id}")
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_manager)):
    repo = ClientRepository(db)
    deleted = await repo.delete(client_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Client not found")
    return ok(message="Client deleted")


@router.get("/{client_id}/orders")
async def client_orders(client_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    repo = OrderRepository(db)
    orders = await repo.get_by_client(client_id)
    from sqlalchemy import select, func
    from app.models.order import Order
    total = sum(float(o["total_amount"] or 0) for o in orders)
    return ok({"orders": orders, "total_business": total})
