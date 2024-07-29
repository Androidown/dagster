from typing import Dict, Any, List, Type, Optional

from pydantic import BaseModel, validator
import keyword


class Step(BaseModel):
    __registry__: Dict[str, Type["Step"]] = {}

    id: str
    type: str
    name: str
    properties: Dict[str, Any]
    branches: Optional[Dict[str, List["Step"]]]

    def __new__(cls, *bases, **namespace):
        if tp := namespace.get('type'):
            cls = cls.__registry__.get(tp, Step)
        return BaseModel.__new__(cls)

    @validator('name', check_fields=False)
    def rename_keywords(cls, name):
        if keyword.iskeyword(name):
            return f"_{name}"
        return name

    def __init_subclass__(cls, type: str = None):
        if type is not None:
            cls.__registry__[type] = cls

    def __hash__(self):
        return hash(self.id)


class CodeProperty(BaseModel):
    code: Optional[str]


class CodeStep(Step, type='code'):
    type: str = 'code'
    properties: CodeProperty


class BranchedStep(Step):
    branches: Dict[str, List[Step]]


class MapStep(BranchedStep, type='map'):
    pass


class IfElseProperty(BaseModel):
    condition: Optional[str]


class TrueFalseBranch(BaseModel):
    true: List[Step]
    false: List[Step]


class IfElseStep(BranchedStep, type='switch'):
    branches: TrueFalseBranch
    properties: IfElseProperty
