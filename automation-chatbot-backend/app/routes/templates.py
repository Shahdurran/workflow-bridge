from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schema import Template
from app.services.storage import StorageService

router = APIRouter()
storage = StorageService()

@router.get("/", response_model=List[Template])
async def get_templates():
    """Get all workflow templates"""
    try:
        templates = await storage.get_templates()
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch templates: {str(e)}")

@router.get("/{template_id}", response_model=Template)
async def get_template(template_id: str):
    """Get a specific template by ID"""
    try:
        template = await storage.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch template: {str(e)}")
