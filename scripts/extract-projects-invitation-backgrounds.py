"""Copy approved decorative pixels, excluding every printed control.

The reference is immutable. Missing scenery behind printed type/buttons is not
invented: those pixels are transparent, over the matching sky/ivory CSS base.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'public/ccccccc.PNG').convert('RGB')
for kind, origin in [('sunrise',20), ('leaves',776)]:
    result = source.crop((origin,78,origin+744,488)).convert('RGBA')
    alpha = Image.new('L', result.size, 255)
    draw = ImageDraw.Draw(alpha)
    # Physically discard screenshot text, icons, and buttons. Nothing is concealed.
    if kind == 'sunrise':
        exclusions=[(312,10,439,124),(110,123,665,187),(93,197,693,267)]
    else:
        exclusions=[(297,16,430,126),(155,124,592,189),(97,198,661,269)]
    for rect in exclusions:
        draw.rectangle(rect,fill=0)
    # Feather only unobstructed surrounding pixels into the CSS sky/ivory.
    # Keep the printed content fully absent even after the feather operation.
    removed=ImageChops.invert(alpha)
    feather=removed.filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(12))
    alpha=ImageChops.multiply(alpha,ImageChops.invert(feather))
    # The new functional buttons occupy the same silhouettes as the source.
    # Discard the source button itself, retaining every surrounding landscape pixel.
    button=(222,305,581,377) if kind=='sunrise' else (190,307,565,377)
    ImageDraw.Draw(alpha).rounded_rectangle(button,radius=36,fill=0)
    edge=Image.new('L',result.size)
    ImageDraw.Draw(edge).rounded_rectangle((4,4,739,405),radius=33,fill=255)
    result.putalpha(ImageChops.multiply(alpha,edge))
    pixels=result.load()
    for y in range(result.height):
        for x in range(result.width):
            if pixels[x,y][3]==0:pixels[x,y]=(0,0,0,0)
    result.save(root / f'public/projects-invitation-{kind}.png',optimize=True)
# Isolate only the exact approved icon pigments, without screenshot backgrounds.
for kind, box in [('giving',(332,90,458,202)),('community',(1074,97,1204,203))]:
    icon=source.crop(box).convert('RGBA')
    px=icon.load()
    for y in range(icon.height):
        for x in range(icon.width):
            r,g,b,a=px[x,y]
            blue=b>r*1.25 and b>70 and r<100
            gold=r>180 and g>130 and b<110
            if not (blue or gold):px[x,y]=(0,0,0,0)
    icon.save(root / f'public/projects-invitation-{kind}-icon.png',optimize=True)

    if kind == 'giving':
        # The preview must not depend on a CSS filter: bake only the heart pigment
        # into a separate derived icon, leaving the original blue hand untouched.
        red_icon=icon.copy()
        data=red_icon.load()
        for y in range(red_icon.height):
            for x in range(red_icon.width):
                r,g,b,a=data[x,y]
                if a and r>180 and g>130 and b<110:
                    data[x,y]=(182,91,96,a)
        red_icon.save(root / 'public/projects-invitation-giving-soft-red.png',optimize=True)
